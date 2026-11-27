import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const topicId = "10000000-0000-0000-0000-000000000001";

async function fixture(startAttempt) {
  const paths = [];
  const useGrammarPractice = loadHook(
    "src/features/grammar/hooks/use-grammar-practice.ts",
    "useGrammarPractice",
    {
      useRouter: () => ({ push: (path) => paths.push(path) }),
      useApiResource: () => ({
        data: { availableQuestions: 20 },
        error: null,
        reload() {},
      }),
      fetchExercises: async () => {},
      apiErrorMessage: () => "Chưa xác nhận được lượt luyện.",
      startAttempt,
    }
  );
  return {
    hook: await mountHook(() => useGrammarPractice(topicId), {}),
    paths,
  };
}

test("grammar start retains its key and payload after an unreadable success, then resumes the server attempt", async () => {
  const calls = [];
  const { hook, paths } = await fixture(async (body, key) => {
    calls.push({ body, key });
    return calls.length === 1
      ? {
          ok: false,
          status: 201,
          reason: "http",
          problem: { code: "INVALID_RESPONSE" },
        }
      : { ok: true, data: { id: topicId, status: "IN_PROGRESS" } };
  });
  try {
    await act(async () => hook.current().start({ preventDefault() {} }));
    assert.equal(hook.current().retrying, true);
    await act(async () => hook.current().start({ preventDefault() {} }));
    assert.deepEqual(calls[1], calls[0]);
    assert.equal(paths[0], `/learn/practice?attempt=${topicId}`);
  } finally {
    await hook.close();
  }
});

test("grammar start is single flight and submitted replay opens results", async () => {
  let release;
  let calls = 0;
  const { hook, paths } = await fixture(async () => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  try {
    await act(async () => {
      void hook.current().start({ preventDefault() {} });
      void hook.current().start({ preventDefault() {} });
    });
    assert.equal(calls, 1);
    await act(async () =>
      release({ ok: true, data: { id: topicId, status: "SUBMITTED" } })
    );
    assert.equal(paths[0], `/learn/results?view=grammar&attempt=${topicId}`);
  } finally {
    await hook.close();
  }
});

test("a definite grammar start rejection allows a corrected request with a new key", async () => {
  const keys = [];
  const { hook } = await fixture(async (_body, key) => {
    keys.push(key);
    return { ok: false, status: 400, reason: "http", problem: null };
  });
  try {
    await act(async () => hook.current().start({ preventDefault() {} }));
    assert.equal(hook.current().retrying, false);
    await act(async () => hook.current().start({ preventDefault() {} }));
    assert.notEqual(keys[1], keys[0]);
  } finally {
    await hook.close();
  }
});
