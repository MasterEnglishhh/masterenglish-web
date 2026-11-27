import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

test("study heartbeat is serialized and stops after a conflict", async () => {
  const original = {
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    document: globalThis.document,
  };
  let tick;
  const calls = [];
  let release;
  globalThis.setInterval = (fn) => {
    tick = fn;
    return 1;
  };
  globalThis.clearInterval = () => {};
  globalThis.document = {
    visibilityState: "visible",
    hasFocus: () => true,
    addEventListener() {},
    removeEventListener() {},
  };
  const useStudySession = loadHook(
    "src/features/learning/hooks/use-study-session.ts",
    "useStudySession",
    {
      startStudySession: async () => ({
        ok: true,
        data: { sessionId: "s", creditToken: "t", version: 0 },
      }),
      heartbeatStudySession: async (_id, input) => {
        calls.push(input);
        return new Promise((resolve) => {
          release = resolve;
        });
      },
      closeStudySession: async () => ({ ok: true, data: {} }),
    }
  );
  const fixture = await mountHook(
    () => useStudySession("LESSON", "10000000-0000-0000-0000-000000000001"),
    {}
  );
  try {
    await act(async () => {
      tick();
      tick();
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].version, 0);
    await act(async () => release({ ok: false, status: 409 }));
    await act(async () => tick());
    assert.equal(calls.length, 1);
    assert.ok(fixture.current().warning);
  } finally {
    await fixture.close();
    Object.assign(globalThis, original);
  }
});

test("study tracking starts when an initially hidden lesson becomes visible", async () => {
  const originalDocument = globalThis.document;
  const listeners = new Map();
  let starts = 0;
  let closes = 0;
  globalThis.document = {
    visibilityState: "hidden",
    hasFocus: () => true,
    addEventListener(name, fn) {
      listeners.set(name, fn);
    },
    removeEventListener(name, fn) {
      if (listeners.get(name) === fn) listeners.delete(name);
    },
  };
  const useStudySession = loadHook(
    "src/features/learning/hooks/use-study-session.ts",
    "useStudySession",
    {
      startStudySession: async () => {
        starts++;
        return {
          ok: true,
          data: { sessionId: "s", creditToken: "t", version: 0 },
        };
      },
      heartbeatStudySession: async () => ({ ok: false, status: 409 }),
      closeStudySession: async () => {
        closes++;
        return { ok: true, data: {} };
      },
    }
  );
  const fixture = await mountHook(
    () => useStudySession("LESSON", "10000000-0000-0000-0000-000000000001"),
    {}
  );
  try {
    assert.equal(starts, 0);
    globalThis.document.visibilityState = "visible";
    await act(async () => listeners.get("visibilitychange")?.());
    assert.equal(starts, 1);
    await fixture.close();
    assert.equal(closes, 1);
    assert.equal(listeners.size, 0);
  } finally {
    globalThis.document = originalDocument;
  }
});
