import type { HttpOutcome } from "../../../lib/http.ts";
import type {
  AttemptStatus,
  SavedAnswer,
  SaveAnswerInput,
  SaveAnswerResponse,
} from "../types/practice.ts";

interface QueueSnapshot {
  selected: Record<string, string | null>;
  settled: boolean;
  saving: boolean;
  failed: boolean;
  message: string | null;
}
type Pending = { id: string; body: SaveAnswerInput; key: string };

/** One request at a time; repeated choices replace only the queued write, never an uncertain request. */
export class AnswerQueue {
  private confirmed: Record<string, SavedAnswer>;
  private queued = new Map<string, string | null>();
  private pending: Pending | null = null;
  private busy = false;
  private stopped = false;
  private generation = 0;
  private needsRefresh = false;
  private closed = false;
  private snapshot: QueueSnapshot;
  private listeners = new Set<() => void>();
  private save: (
    id: string,
    body: SaveAnswerInput,
    key: string
  ) => Promise<HttpOutcome<SaveAnswerResponse>>;
  private reload: () => Promise<{
    status: AttemptStatus;
    savedAnswers: Record<string, SavedAnswer>;
  } | null>;
  private onClosed: (status: AttemptStatus) => void;

  constructor(
    answers: Record<string, SavedAnswer>,
    save: AnswerQueue["save"],
    reload: AnswerQueue["reload"],
    onClosed: AnswerQueue["onClosed"]
  ) {
    this.confirmed = { ...answers };
    this.save = save;
    this.reload = reload;
    this.onClosed = onClosed;
    this.snapshot = {
      selected: Object.fromEntries(
        Object.entries(answers).map(([id, a]) => [id, a.selectedOptionId])
      ),
      settled: true,
      saving: false,
      failed: false,
      message: null,
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(message = this.snapshot.message, failed = false) {
    this.snapshot = {
      ...this.snapshot,
      settled: !this.needsRefresh && !this.pending && this.queued.size === 0,
      saving: this.busy,
      failed,
      message,
    };
    for (const listener of this.listeners) listener();
  }
  choose = (id: string, value: string | null) => {
    if (this.stopped || !this.confirmed[id]) return;
    this.snapshot = {
      ...this.snapshot,
      selected: { ...this.snapshot.selected, [id]: value },
    };
    this.queued.set(id, value);
    this.publish(
      this.snapshot.failed ? this.snapshot.message : null,
      this.snapshot.failed
    );
    if (!this.snapshot.failed) void this.drain();
  };
  retry = () => {
    if (!this.busy && !this.stopped) {
      if (this.needsRefresh) void this.refresh();
      else void this.drain();
    }
  };
  activate = () => {
    if (this.closed) return;
    this.stopped = false;
    if (this.needsRefresh) void this.refresh();
  };
  stop = () => {
    this.generation++;
    this.stopped = true;
    this.busy = false;
    this.needsRefresh = !this.closed;
    this.publish(null);
  };
  acceptFresh = (fresh: {
    status: AttemptStatus;
    savedAnswers: Record<string, SavedAnswer>;
  }) => {
    this.confirmed = { ...fresh.savedAnswers };
    this.needsRefresh = false;
    this.snapshot = {
      ...this.snapshot,
      selected: {
        ...Object.fromEntries(
          Object.entries(fresh.savedAnswers).map(([id, answer]) => [
            id,
            answer.selectedOptionId,
          ])
        ),
        ...(this.pending
          ? { [this.pending.id]: this.pending.body.selectedOptionId }
          : {}),
        ...Object.fromEntries(this.queued),
      },
    };
    if (fresh.status !== "IN_PROGRESS") {
      this.closed = true;
      this.pending = null;
      this.queued.clear();
      this.stop();
      this.onClosed(fresh.status);
    } else this.publish();
  };
  private async refresh() {
    if (this.busy || this.stopped) return;
    const generation = this.generation;
    this.busy = true;
    this.publish(null);
    try {
      const fresh = await this.reload();
      if (this.stopped || generation !== this.generation) return;
      this.busy = false;
      if (!fresh) {
        this.publish(
          "Chưa đồng bộ được bài luyện. Hãy tải lại trước khi tiếp tục.",
          true
        );
        return;
      }
      this.acceptFresh(fresh);
      if (!this.stopped) void this.drain();
    } catch {
      if (this.stopped || generation !== this.generation) return;
      this.busy = false;
      this.publish("Chưa đồng bộ được bài luyện. Hãy thử lại.", true);
    }
  }
  private async drain() {
    if (this.busy || this.stopped || this.needsRefresh) return;
    const generation = this.generation;
    this.busy = true;
    this.publish(null);
    try {
      while (!this.stopped && (this.pending || this.queued.size)) {
        if (!this.pending) {
          const [id, selectedOptionId] = this.queued.entries().next().value!;
          this.queued.delete(id);
          if (selectedOptionId === this.confirmed[id].selectedOptionId)
            continue;
          this.pending = {
            id,
            body: {
              selectedOptionId,
              expectedVersion: this.confirmed[id].version,
            },
            key: crypto.randomUUID(),
          };
        }
        const pending = this.pending;
        const result = await this.save(pending.id, pending.body, pending.key);
        if (this.stopped || generation !== this.generation) return;
        if (result.ok) {
          this.confirmed[pending.id] = {
            selectedOptionId: result.data.selectedOptionId,
            version: result.data.version,
          };
          this.pending = null;
          continue;
        }
        if (result.status === 409) {
          const fresh = await this.reload();
          if (this.stopped || generation !== this.generation) return;
          if (!fresh) {
            this.publish(
              "Chưa xác nhận được đáp án trên máy chủ. Hãy thử đồng bộ lại.",
              true
            );
            return;
          }
          if (fresh.status !== "IN_PROGRESS") {
            this.acceptFresh(fresh);
            return;
          }
          this.confirmed = { ...fresh.savedAnswers };
          this.snapshot = {
            ...this.snapshot,
            selected: {
              ...Object.fromEntries(
                Object.entries(fresh.savedAnswers).map(([id, answer]) => [
                  id,
                  answer.selectedOptionId,
                ])
              ),
              ...Object.fromEntries(this.queued),
            },
          };
          this.pending = null;
          this.publish(
            "Đáp án đã đổi ở một yêu cầu khác. Đã tải bản trên máy chủ; hãy kiểm tra và chọn lại nếu cần."
          );
          continue;
        }
        this.publish(
          "Chưa xác nhận được lần lưu. Thử lại để giữ đúng lựa chọn trước khi nộp bài.",
          true
        );
        return;
      }
    } catch {
      if (this.stopped || generation !== this.generation) return;
      this.publish(
        "Kết nối gián đoạn. Hãy thử lại lần lưu trước khi nộp bài.",
        true
      );
    } finally {
      if (generation === this.generation) {
        this.busy = false;
        this.publish(this.snapshot.message, this.snapshot.failed);
      }
    }
  }
}
