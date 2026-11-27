import test from "node:test";
import assert from "node:assert/strict";
import { AnswerQueue } from "./answer-queue.ts";

const ok = (selectedOptionId: string | null, version: number) => ({
  ok: true as const,
  status: 200,
  data: { snapshotId: "q", selectedOptionId, version, answeredAt: null },
});
const failure = (status: number) => ({
  ok: false as const,
  reason: "http" as const,
  status,
  problem: null,
  retryAfterSeconds: null,
});
const turn = () => new Promise((resolve) => setTimeout(resolve, 0));

test("queues the latest choice behind an in-flight write and uses its confirmed version", async () => {
  let release!: (result: ReturnType<typeof ok>) => void;
  const calls: {
    body: { selectedOptionId: string | null; expectedVersion: number };
    key: string;
  }[] = [];
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async (_id, body, key) => {
      calls.push({ body, key });
      return calls.length === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : ok(body.selectedOptionId, 2);
    },
    async () => null,
    () => {}
  );
  queue.choose("q", "a");
  queue.choose("q", "b");
  queue.choose("q", "c");
  assert.equal(calls.length, 1);
  release(ok("a", 1));
  await turn();
  assert.deepEqual(
    calls.map((c) => c.body),
    [
      { selectedOptionId: "a", expectedVersion: 0 },
      { selectedOptionId: "c", expectedVersion: 1 },
    ]
  );
  assert.equal(queue.getSnapshot().settled, true);
  assert.equal(queue.getSnapshot().selected.q, "c");
});

for (const status of [0, 503, 200])
  test(`uncertain save ${status} retries the same key and payload before allowing submit`, async () => {
    const calls: unknown[] = [];
    const queue = new AnswerQueue(
      { q: { selectedOptionId: null, version: 0 } },
      async (_id, body, key) => {
        calls.push({ body, key });
        return calls.length === 1 ? failure(status) : ok("a", 1);
      },
      async () => null,
      () => {}
    );
    queue.choose("q", "a");
    await turn();
    assert.equal(queue.getSnapshot().settled, false);
    queue.retry();
    await turn();
    assert.deepEqual(calls[0], calls[1]);
    assert.equal(queue.getSnapshot().settled, true);
  });

test("chọn lại sau lỗi lưu vẫn giữ thông báo để thử lại đúng key rồi lưu lựa chọn mới", async () => {
  const calls: {
    body: { selectedOptionId: string | null; expectedVersion: number };
    key: string;
  }[] = [];
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async (_id, body, key) => {
      calls.push({ body, key });
      return calls.length === 1
        ? failure(503)
        : ok(body.selectedOptionId, body.expectedVersion + 1);
    },
    async () => null,
    () => {}
  );
  queue.choose("q", "a");
  await turn();
  const error = queue.getSnapshot().message;
  assert.ok(error);
  queue.choose("q", "b");
  assert.equal(queue.getSnapshot().message, error);
  assert.equal(queue.getSnapshot().failed, true);
  assert.equal(queue.getSnapshot().settled, false);
  queue.retry();
  await turn();
  assert.deepEqual(calls[1], calls[0]);
  assert.notEqual(calls[2].key, calls[1].key);
  assert.deepEqual(calls[2].body, {
    selectedOptionId: "b",
    expectedVersion: 1,
  });
  assert.equal(queue.getSnapshot().selected.q, "b");
  assert.equal(queue.getSnapshot().settled, true);
  assert.equal(queue.getSnapshot().failed, false);
});

test("CAS conflict reloads confirmed server answer without silently overwriting it", async () => {
  let reads = 0;
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async () => failure(409),
    async () => {
      reads++;
      return {
        status: "IN_PROGRESS",
        savedAnswers: { q: { selectedOptionId: "other-tab", version: 4 } },
      };
    },
    () => {}
  );
  queue.choose("q", "a");
  await turn();
  assert.equal(reads, 1);
  assert.equal(queue.getSnapshot().selected.q, "other-tab");
  assert.equal(queue.getSnapshot().settled, true);
  assert.ok(queue.getSnapshot().message);
});

test("clearing a choice queued behind a save persists null with the next version", async () => {
  let release!: (result: ReturnType<typeof ok>) => void;
  const writes: unknown[] = [];
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async (_id, body) => {
      writes.push(body);
      return writes.length === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : ok(null, 2);
    },
    async () => null,
    () => {}
  );
  queue.choose("q", "a");
  queue.choose("q", null);
  release(ok("a", 1));
  await turn();
  assert.deepEqual(writes, [
    { selectedOptionId: "a", expectedVersion: 0 },
    { selectedOptionId: null, expectedVersion: 1 },
  ]);
  assert.equal(queue.getSnapshot().settled, true);
});

test("a failed conflict reload blocks submit until a later reload confirms the version", async () => {
  let reads = 0;
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async () => failure(409),
    async () =>
      ++reads === 1
        ? null
        : {
            status: "IN_PROGRESS",
            savedAnswers: { q: { selectedOptionId: null, version: 1 } },
          },
    () => {}
  );
  queue.choose("q", "a");
  await turn();
  assert.equal(queue.getSnapshot().settled, false);
  queue.retry();
  await turn();
  assert.equal(queue.getSnapshot().settled, true);
});

test("a server-closed attempt drops queued writes and reports its authoritative status", async () => {
  let closed = "";
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async () => failure(409),
    async () => ({
      status: "SUBMITTED",
      savedAnswers: { q: { selectedOptionId: null, version: 0 } },
    }),
    (status) => {
      closed = status;
    }
  );
  queue.choose("q", "a");
  await turn();
  assert.equal(closed, "SUBMITTED");
  assert.equal(queue.getSnapshot().settled, true);
  queue.choose("q", "b");
  assert.equal(queue.getSnapshot().selected.q, "a");
});

test("unmount stops queued writes after the in-flight request finishes", async () => {
  let release!: (result: ReturnType<typeof ok>) => void;
  let writes = 0;
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async () => {
      writes++;
      return new Promise((resolve) => {
        release = resolve;
      });
    },
    async () => null,
    () => assert.fail("disposed")
  );
  queue.choose("q", "a");
  queue.choose("q", "b");
  queue.stop();
  release(ok("a", 1));
  await turn();
  assert.equal(writes, 1);
  assert.equal(queue.getSnapshot().saving, false);
});

test("reactivation confirms server state and replays the uncertain key before queued choices", async () => {
  let release!: (result: ReturnType<typeof ok>) => void;
  let reload!: (result: {
    status: "IN_PROGRESS";
    savedAnswers: Record<
      string,
      { selectedOptionId: string | null; version: number }
    >;
  }) => void;
  const writes: { body: unknown; key: string }[] = [];
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async (_id, body, key) => {
      writes.push({ body, key });
      return writes.length === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : ok(body.selectedOptionId, body.expectedVersion + 1);
    },
    async () =>
      new Promise((resolve) => {
        reload = resolve;
      }),
    () => {}
  );
  queue.choose("q", "a");
  queue.stop();
  queue.activate();
  queue.choose("q", "b");
  assert.equal(queue.getSnapshot().settled, false);
  assert.equal(writes.length, 1);
  reload({
    status: "IN_PROGRESS",
    savedAnswers: { q: { selectedOptionId: "a", version: 1 } },
  });
  release(ok("a", 1));
  await turn();
  assert.equal(writes.length, 3);
  assert.deepEqual(writes[0], writes[1]);
  assert.deepEqual(writes[2].body, {
    selectedOptionId: "b",
    expectedVersion: 1,
  });
  assert.equal(queue.getSnapshot().selected.q, "b");
  assert.equal(queue.getSnapshot().settled, true);
});

test("returning with no local writes still reloads other-tab answers before submit", async () => {
  let reload!: (result: {
    status: "IN_PROGRESS";
    savedAnswers: Record<
      string,
      { selectedOptionId: string | null; version: number }
    >;
  }) => void;
  const queue = new AnswerQueue(
    { q: { selectedOptionId: null, version: 0 } },
    async () => assert.fail("no writes"),
    async () =>
      new Promise((resolve) => {
        reload = resolve;
      }),
    () => {}
  );
  queue.stop();
  queue.activate();
  assert.equal(queue.getSnapshot().settled, false);
  reload({
    status: "IN_PROGRESS",
    savedAnswers: { q: { selectedOptionId: "b", version: 2 } },
  });
  await turn();
  assert.equal(queue.getSnapshot().selected.q, "b");
  assert.equal(queue.getSnapshot().settled, true);
});

test("conflict reload reconciles every answer shown before submit", async () => {
  const queue = new AnswerQueue(
    {
      q1: { selectedOptionId: null, version: 0 },
      q2: { selectedOptionId: null, version: 0 },
    },
    async () => failure(409),
    async () => ({
      status: "IN_PROGRESS",
      savedAnswers: {
        q1: { selectedOptionId: "a", version: 1 },
        q2: { selectedOptionId: "b", version: 2 },
      },
    }),
    () => {}
  );
  queue.choose("q1", "a");
  await turn();
  assert.deepEqual(queue.getSnapshot().selected, { q1: "a", q2: "b" });
  assert.equal(queue.getSnapshot().settled, true);
});
