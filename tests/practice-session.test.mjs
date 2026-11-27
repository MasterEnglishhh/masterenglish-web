import test from "node:test";
import assert from "node:assert/strict";
import { AnswerQueue } from "../src/features/practice/lib/answer-queue.ts";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";
const attempt = {
  id: "attempt",
  status: "IN_PROGRESS",
  deadlineAt: null,
  savedAnswers: { q: { selectedOptionId: null, version: 0 } },
};
test("uncertain submit locks further choices and retry opens confirmed results", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  let submits = 0,
    writes = 0;
  const routes = [];
  const router = { replace: (path) => routes.push(path) };
  const useAttemptSession = loadHook(
    "src/features/practice/hooks/use-attempt-session.ts",
    "useAttemptSession",
    {
      AnswerQueue,
      useRouter: () => router,
      useStudySession: () => ({ warning: null }),
      apiErrorMessage: () => "Thử lại",
      isUncertain: (result) =>
        !result.ok &&
        (result.status === 0 || result.status >= 500 || result.status < 300),
      fetchAttempt: async () => ({ ok: true, data: attempt }),
      saveAnswer: async () => {
        writes++;
        return { ok: true };
      },
      submitAttempt: async () => {
        submits++;
        return submits === 1 ? { ok: false, status: 503 } : { ok: true };
      },
    }
  );
  const fixture = await mountHook(() => useAttemptSession(attempt), {});
  try {
    await act(async () => fixture.current().submit());
    assert.equal(fixture.current().submitUncertain, true);
    await act(async () => fixture.current().select("q", "a"));
    assert.equal(writes, 0);
    await act(async () => fixture.current().submit());
    assert.equal(submits, 2);
    assert.ok(routes.includes("/learn/results?attempt=attempt"));
  } finally {
    await fixture.close();
    globalThis.window = originalWindow;
  }
});

test("a submit response after unmount never navigates the next session", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  let release;
  const routes = [];
  const router = { replace: (path) => routes.push(path) };
  const useAttemptSession = loadHook(
    "src/features/practice/hooks/use-attempt-session.ts",
    "useAttemptSession",
    {
      AnswerQueue,
      useRouter: () => router,
      useStudySession: () => ({ warning: null }),
      apiErrorMessage: () => "retry",
      submitAttempt: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    }
  );
  const fixture = await mountHook(() => useAttemptSession(attempt), {});
  let submission;
  await act(async () => {
    submission = fixture.current().submit();
  });
  await fixture.close();
  await act(async () => {
    release({ ok: true });
    await submission;
  });
  globalThis.window = originalWindow;
  assert.deepEqual(routes, []);
});

test("same-attempt refreshed props reconcile all displayed saved answers", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  const router = { replace() {} };
  const useAttemptSession = loadHook(
    "src/features/practice/hooks/use-attempt-session.ts",
    "useAttemptSession",
    {
      AnswerQueue,
      useRouter: () => router,
      useStudySession: () => ({ warning: null }),
    }
  );
  const fixture = await mountHook((props) => useAttemptSession(props), attempt);
  try {
    await fixture.update({
      ...attempt,
      savedAnswers: { q: { selectedOptionId: "other-tab", version: 2 } },
    });
    assert.equal(fixture.current().saves.selected.q, "other-tab");
    assert.equal(fixture.current().saves.settled, true);
  } finally {
    await fixture.close();
    globalThis.window = originalWindow;
  }
});

test("late deadline response after leaving the page does not navigate", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  let release;
  const routes = [];
  const router = { replace: (path) => routes.push(path) };
  const useAttemptSession = loadHook(
    "src/features/practice/hooks/use-attempt-session.ts",
    "useAttemptSession",
    {
      AnswerQueue,
      useRouter: () => router,
      useStudySession: () => ({ warning: null }),
      fetchAttempt: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    }
  );
  const fixture = await mountHook(
    () => useAttemptSession({ ...attempt, deadlineAt: "2020-01-01T00:00:00Z" }),
    {}
  );
  await fixture.close();
  await act(async () => {
    release({ ok: true, data: { ...attempt, status: "SUBMITTED" } });
  });
  globalThis.window = originalWindow;
  assert.deepEqual(routes, []);
});
