import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";
test("practice start preserves the request key after an unreadable success and routes submitted replay to results", async () => {
  const calls = [],
    routes = [];
  const useStartAttempt = loadHook(
    "src/features/practice/hooks/use-start-attempt.ts",
    "useStartAttempt",
    {
      useRouter: () => ({ push: (path) => routes.push(path) }),
      apiErrorMessage: () => "retry",
      isUncertain: (result) =>
        !result.ok &&
        (result.status === 0 || result.status >= 500 || result.status < 300),
      startAttempt: async (body, key) => {
        calls.push({ body, key });
        return calls.length === 1
          ? { ok: false, status: 201 }
          : { ok: true, data: { id: "attempt", status: "SUBMITTED" } };
      },
    }
  );
  const fixture = await mountHook(() => useStartAttempt(), {});
  try {
    await act(async () =>
      fixture
        .current()
        .start({ source: { type: "PRACTICE_SET", practiceSetId: "set" } })
    );
    assert.equal(fixture.current().hasRetry, true);
    await act(async () =>
      fixture
        .current()
        .start({ source: { type: "PRACTICE_SET", practiceSetId: "different" } })
    );
    assert.deepEqual(calls[0], calls[1]);
    assert.deepEqual(routes, ["/learn/results?attempt=attempt"]);
  } finally {
    await fixture.close();
  }
});

test("a start response after leaving its page does not redirect the next session", async () => {
  let release;
  const routes = [];
  const router = { push: (path) => routes.push(path) };
  const useStartAttempt = loadHook(
    "src/features/practice/hooks/use-start-attempt.ts",
    "useStartAttempt",
    {
      useRouter: () => router,
      startAttempt: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    }
  );
  const fixture = await mountHook(() => useStartAttempt(), {});
  let pending;
  await act(async () => {
    pending = fixture
      .current()
      .start({ source: { type: "PRACTICE_SET", practiceSetId: "set" } });
  });
  await fixture.close();
  await act(async () => {
    release({ ok: true, data: { id: "attempt", status: "IN_PROGRESS" } });
    await pending;
  });
  assert.deepEqual(routes, []);
});
