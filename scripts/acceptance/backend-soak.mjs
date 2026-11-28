import assert from "node:assert/strict";

export function assertAuditTarget(baseUrl, container) {
  assert.equal(baseUrl, "http://127.0.0.1:28081");
  assert.equal(container.labels?.["masterenglish.audit"], "9975");
  assert.deepEqual(container.ports?.["5432/tcp"], [
    { HostIp: "127.0.0.1", HostPort: "25433" },
  ]);
}

export function assertStorageCapacity(capacity, initialDatabaseBytes) {
  const gib = 1024 ** 3;
  for (const value of [initialDatabaseBytes, ...Object.values(capacity)])
    assert.ok(Number.isFinite(value) && value >= 0);
  assert.ok(capacity.hostFreeBytes >= 2 * gib, "Host disk is nearly full");
  assert.ok(
    capacity.postgresFreeBytes >= 2 * gib,
    "Database disk is nearly full"
  );
  assert.ok(capacity.databaseBytes <= 8 * gib, "Audit database exceeded 8 GiB");
  assert.ok(
    capacity.databaseBytes - initialDatabaseBytes <= 2 * gib,
    "Audit database grew by more than 2 GiB"
  );
}

export async function runTimedWorkers(
  concurrency,
  durationMs,
  flow,
  controller = new AbortController(),
  drainMs = 30_000
) {
  assert.ok(Number.isInteger(concurrency) && concurrency > 0);
  assert.ok(Number.isFinite(durationMs) && durationMs > 0);
  assert.ok(Number.isFinite(drainMs) && drainMs >= 0);
  controller.signal.throwIfAborted();
  const deadline = performance.now() + durationMs;
  const counts = Array(concurrency).fill(0);
  let firstError;
  let rejectStopped;
  const stopped = new Promise((_, reject) => {
    rejectStopped = reject;
  });
  const onAbort = () => rejectStopped(controller.signal.reason);
  controller.signal.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => {
    firstError ??= new Error("Soak drain deadline exceeded");
    controller.abort(firstError);
  }, durationMs + drainMs);
  try {
    // shortcut: flow phải xử lý AbortSignal; dùng worker riêng khi cần cưỡng chế dừng công việc.
    await Promise.race([
      stopped,
      Promise.allSettled(
        counts.map(async (_, user) => {
          try {
            while (!controller.signal.aborted && performance.now() < deadline) {
              await flow(user, controller.signal);
              counts[user]++;
            }
          } catch (error) {
            firstError ??= error;
            controller.abort(firstError);
          }
        })
      ),
    ]);
    if (firstError) throw firstError;
    controller.signal.throwIfAborted();
    return counts;
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", onAbort);
  }
}
