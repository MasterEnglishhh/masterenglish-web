"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApiResource } from "@/lib/use-api-resource";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { Dialog } from "@/components/dialog";
import { fetchAttempt } from "../lib/practice-client";
import { useAttemptSession } from "../hooks/use-attempt-session";
import { usePracticeNavigation } from "../hooks/use-practice-navigation";
import { Questions } from "./questions";
import type { ActiveAttempt } from "../types/practice";
import "../styles/practice.css";

function AttemptSession({ attempt }: { attempt: ActiveAttempt }) {
  const session = useAttemptSession(attempt);
  const navigation = usePracticeNavigation(
    !session.saves.settled || session.submitting
  );
  const [confirm, setConfirm] = useState(false);
  const answered = Object.values(session.saves.selected).filter(
    (v) => v !== null
  ).length;
  const locked =
    session.submitting ||
    session.submitUncertain ||
    session.closedStatus !== "IN_PROGRESS" ||
    session.expired;
  return (
    <>
      {navigation.destination && (
        <Dialog
          title="Đáp án chưa lưu xong"
          description={
            <p>
              Rời bài lúc này có thể làm mất lựa chọn chưa được máy chủ xác
              nhận. Bạn có thể ở lại để lưu hoặc thử đồng bộ lại.
            </p>
          }
          onClose={navigation.stay}
        >
          <div className="study-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={navigation.stay}
            >
              Ở lại lưu đáp án
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={navigation.leave}
            >
              Rời bài luyện
            </button>
          </div>
        </Dialog>
      )}
      <div className="glass-card practice-toolbar">
        <div>
          <strong>
            {attempt.category === "TOEIC" ? "Luyện TOEIC" : "Luyện ngữ pháp"}
          </strong>
          <p>
            {answered} / {attempt.totalCount} câu đã chọn
          </p>
        </div>
        <div aria-live="polite" role="status">
          {session.saves.saving
            ? "Đang lưu đáp án..."
            : session.saves.failed
              ? "Có đáp án chưa xác nhận lưu"
              : session.saves.settled
                ? "Đã lưu tất cả đáp án"
                : "Đang chờ lưu"}
        </div>
        {session.remaining !== null && (
          <p role="timer" aria-label="Thời gian còn lại">
            Còn {Math.floor(session.remaining / 60)}:
            {String(session.remaining % 60).padStart(2, "0")}
          </p>
        )}
        <button
          type="button"
          className="btn-primary"
          disabled={locked || !session.saves.settled}
          onClick={() => setConfirm(true)}
        >
          {session.submitting ? "Đang nộp..." : "Nộp bài"}
        </button>
      </div>
      <p>
        Đáp án và lời giải xuất hiện sau khi bạn nộp bài. Lựa chọn được tự động
        lưu.
      </p>
      {session.saves.message && (
        <ErrorState
          variant="inline"
          message={session.saves.message}
          onRetry={session.saves.failed ? session.retrySave : undefined}
          retryLabel="Thử đồng bộ lại"
        />
      )}
      {session.studyWarning && (
        <p role="status" className="practice-notice">
          {session.studyWarning}
        </p>
      )}
      {session.submitError && (
        <ErrorState
          variant="inline"
          message={
            session.submitUncertain
              ? "Chưa xác nhận được lần nộp. Đáp án tạm khóa; hãy thử nộp lại để nhận kết quả."
              : session.submitError
          }
          onRetry={() => void session.submit()}
          retryLabel="Thử nộp lại"
        />
      )}
      {session.expired && (
        <p role="status" className="practice-notice">
          Đã hết thời gian. Đang xác nhận kết quả trên máy chủ...
        </p>
      )}
      {session.closedStatus === "ABANDONED" && (
        <EmptyState
          title="Bài luyện đã đóng"
          action={
            <Link className="btn-primary" href="/learn/toeic">
              Chọn bài luyện khác
            </Link>
          }
        >
          Bài đã bỏ dở và không thể tiếp tục hoặc xem đáp án.
        </EmptyState>
      )}
      <nav className="practice-question-nav" aria-label="Đi đến câu hỏi">
        {attempt.questions.map((q) => (
          <a
            key={q.snapshotId}
            className={session.saves.selected[q.snapshotId] ? "answered" : ""}
            href={`#question-${q.snapshotId}`}
            aria-label={`Câu ${q.displayNumber}${session.saves.selected[q.snapshotId] ? ", đã chọn" : ", chưa chọn"}`}
          >
            {q.displayNumber}
          </a>
        ))}
      </nav>
      <Questions
        groups={attempt.groups}
        questions={attempt.questions}
        selected={session.saves.selected}
        disabled={locked}
        onSelect={session.select}
      />
      <div className="study-actions">
        <button
          className="btn-primary"
          disabled={locked || !session.saves.settled}
          onClick={() => setConfirm(true)}
        >
          Nộp bài
        </button>
        <Link className="btn-ghost" href="/learn/results">
          Lịch sử bài luyện
        </Link>
      </div>
      {confirm && (
        <Dialog
          title="Nộp bài luyện?"
          busy={session.submitting}
          onClose={() => setConfirm(false)}
          description={
            <p>
              Bạn đã chọn {answered}/{attempt.totalCount} câu.
              {answered < attempt.totalCount
                ? ` Còn ${attempt.totalCount - answered} câu chưa trả lời.`
                : ""}{" "}
              Sau khi nộp, đáp án được khóa để xem lại kết quả.
            </p>
          }
        >
          <div className="study-actions">
            <button
              className="btn-primary"
              disabled={session.submitting || !session.saves.settled}
              onClick={() => void session.submit()}
            >
              Xác nhận nộp bài
            </button>
            <button
              className="btn-ghost"
              disabled={session.submitting}
              onClick={() => setConfirm(false)}
            >
              Tiếp tục làm bài
            </button>
          </div>
          {session.submitError && (
            <ErrorState message={session.submitError} variant="inline" />
          )}
        </Dialog>
      )}
    </>
  );
}

function AttemptLoader({ id }: { id: string }) {
  const load = useCallback(
    (signal: AbortSignal) => fetchAttempt(id, signal),
    [id]
  );
  const { data, error, reload, isLoading } = useApiResource(load);
  if (!data)
    return error ? (
      <ErrorState message={error} onRetry={reload} />
    ) : (
      <p role="status">Đang tải bài luyện...</p>
    );
  return (
    <>
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {isLoading && <p role="status">Đang đồng bộ bài luyện...</p>}
      <AttemptSession key={data.id} attempt={data} />
    </>
  );
}

export function PracticePage() {
  const id = useSearchParams().get("attempt");
  return (
    <main className="learning-content inner-page practice-page">
      <div className="page-heading">
        <span className="section-kicker">BÀI LUYỆN CỦA BẠN</span>
        <h1>
          Làm từng câu. <em>Hiểu từng bước.</em>
        </h1>
      </div>
      {id ? (
        <AttemptLoader key={id} id={id} />
      ) : (
        <EmptyState
          title="Chọn một bài để bắt đầu"
          action={
            <div className="study-actions">
              <Link className="btn-primary" href="/learn/grammar">
                Luyện ngữ pháp
              </Link>
              <Link className="btn-ghost" href="/learn/toeic">
                Luyện TOEIC
              </Link>
              <Link
                className="btn-ghost"
                href="/learn/results?status=IN_PROGRESS"
              >
                Tiếp tục bài đang làm
              </Link>
            </div>
          }
        >
          Mở chủ điểm hoặc bộ đề; bài đang làm được lưu trong lịch sử.
        </EmptyState>
      )}
    </main>
  );
}
