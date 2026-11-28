import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";
import { createLatestRequestTracker } from "../src/lib/latest-request.ts";
import { runTimedWorkers } from "../scripts/acceptance/backend-soak.mjs";

const ok = (data) => ({ ok: true, status: 200, data });

test("content returns to the last valid page after an item leaves the filter", async () => {
  let first = true;
  const useContent = loadHook(
    "src/features/admin/hooks/use-admin-content.ts",
    "useAdminContent",
    {
      createLatestRequestTracker,
      fetchContentItems: async () => ({
        success: true,
        data: first
          ? { items: [{ id: "last" }], totalItems: 11, totalPages: 2 }
          : { items: [], totalItems: 10, totalPages: 1 },
      }),
    }
  );
  const content = await mountHook(useContent, {});
  try {
    await act(async () =>
      content.current().setFilters({ ...content.current().filters, page: 2 })
    );
    await act(async () => content.current().refreshContent());
    first = false;
    await act(async () => content.current().refreshContent());
    assert.equal(content.current().filters.page, 1);
    assert.equal(content.current().totalPages, 1);
  } finally {
    await content.close();
  }
});

test("a failed unread count does not block the feed", async () => {
  let loader;
  const useNotifications = loadHook(
    "src/features/notifications/hooks/use-learner-notifications.ts",
    "useLearnerNotifications",
    {
      useApiResource: (load) => {
        loader = load;
        return { reload() {} };
      },
      fetchNotifications: async () =>
        ok({ items: [{ id: "notice" }], totalPages: 1 }),
      fetchUnreadCount: async () => ({ ok: false, status: 503 }),
    }
  );
  const notifications = await mountHook(
    () => useNotifications({ page: 0 }),
    {}
  );
  try {
    const result = await loader(new AbortController().signal);
    assert.equal(result.ok, true);
    assert.equal(result.data.count, null);
    assert.equal(result.data.feed.items.length, 1);
  } finally {
    await notifications.close();
  }
});

test("reloading grammar progress never sends a write", async () => {
  let loader;
  let writes = [];
  const useLesson = loadHook(
    "src/features/grammar/hooks/use-grammar-lesson.ts",
    "useGrammarLesson",
    {
      useApiResource: (load) => {
        loader = load;
        return { reload() {} };
      },
      fetchLesson: async () => ok({ id: "lesson" }),
      fetchLessonProgress: async () =>
        ok([{ lessonId: "lesson", state: "IN_PROGRESS" }]),
      updateLessonProgress: async (id, state) => {
        writes.push({ id, state });
        return ok({ lessonId: id, state });
      },
    }
  );
  const lesson = await mountHook(() => useLesson("lesson"), {});
  try {
    await loader(new AbortController().signal);
    await loader(new AbortController().signal);
    assert.equal(writes.length, 0);
  } finally {
    await lesson.close();
  }
});

test("opening a new grammar lesson starts once; reload and completion do not restart it", async () => {
  const writes = [];
  let progress = [];
  const useApiResource = loadHook(
    "src/lib/use-api-resource.ts",
    "useApiResource",
    {}
  );
  const useLesson = loadHook(
    "src/features/grammar/hooks/use-grammar-lesson.ts",
    "useGrammarLesson",
    {
      useApiResource,
      fetchLesson: async () => ok({ id: "lesson" }),
      fetchLessonProgress: async () => ok(progress),
      updateLessonProgress: async (id, state) => {
        writes.push(state);
        const current = { lessonId: id, state };
        progress = [current];
        return ok(current);
      },
    }
  );
  const fixture = await mountHook(() => useLesson("lesson"), {});
  try {
    assert.deepEqual(writes, ["IN_PROGRESS"]);
    assert.equal(fixture.current().isSaving, false);
    await act(async () => fixture.current().reload());
    assert.deepEqual(writes, ["IN_PROGRESS"]);
    await act(async () => fixture.current().complete());
    assert.deepEqual(writes, ["IN_PROGRESS", "COMPLETED"]);
    assert.equal(fixture.current().data.progress.state, "COMPLETED");
  } finally {
    await fixture.close();
  }
});

test("a stopped heartbeat releases the study lock for another tab", async () => {
  const original = {
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
  let held = false,
    tick;
  globalThis.document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
    hasFocus: () => true,
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        async request(_name, _options, action) {
          if (held) return action(null);
          held = true;
          try {
            return await action({});
          } finally {
            held = false;
          }
        },
      },
    },
  });
  globalThis.setInterval = (callback) => {
    tick = callback;
    return 1;
  };
  globalThis.clearInterval = () => {};
  const useStudy = loadHook(
    "src/features/learning/hooks/use-study-session.ts",
    "useStudySession",
    {
      startStudySession: async () =>
        ok({ sessionId: "s", creditToken: "t", version: 0 }),
      heartbeatStudySession: async () => ({ ok: false, status: 503 }),
      closeStudySession: async () => ok({}),
    }
  );
  let study, second;
  try {
    study = await mountHook(() => useStudy("LESSON", "one"), {});
    assert.equal(held, true);
    await act(async () => tick());
    assert.equal(held, false);
    second = await mountHook(() => useStudy("LESSON", "two"), {});
    assert.equal(held, true);
    assert.equal(second.current().warning, null);
  } finally {
    if (second) await second.close();
    if (study) await study.close();
    for (const key of ["document", "navigator"]) {
      if (original[key]) Object.defineProperty(globalThis, key, original[key]);
      else delete globalThis[key];
    }
    globalThis.setInterval = original.setInterval;
    globalThis.clearInterval = original.clearInterval;
  }
});

test("soak returns at the deadline even if a flow ignores abort", async () => {
  let releaseFlow;
  const controller = new AbortController();
  const run = runTimedWorkers(
    1,
    5,
    () =>
      new Promise((resolve) => {
        releaseFlow = resolve;
      }),
    controller,
    10
  );
  const observed = await Promise.race([
    run.then(
      () => "finished",
      () => "rejected"
    ),
    delay(60, "still pending"),
  ]);
  assert.equal(observed, "rejected");
  releaseFlow();
  await run.catch(() => {});
});
