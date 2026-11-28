import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const ok = (data) => ({ ok: true, status: 200, data });
const failed = {
  ok: false,
  status: 500,
  reason: "http",
  problem: null,
  retryAfterSeconds: null,
};
const apiErrorMessage = () => "Không tải được thông báo.";
const useApiResource = loadHook(
  "src/lib/use-api-resource.ts",
  "useApiResource",
  { apiErrorMessage }
);
const page = {
  items: [],
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
};

test("feed shows a load failure and retries both feed and unread count", async () => {
  let calls = 0;
  const useNotifications = loadHook(
    "src/features/notifications/hooks/use-learner-notifications.ts",
    "useLearnerNotifications",
    {
      useApiResource,
      apiErrorMessage,
      fetchNotifications: async () => (++calls === 1 ? failed : ok(page)),
      fetchUnreadCount: async () => ok({ count: 3 }),
    }
  );
  const mounted = await mountHook(useNotifications, {});
  try {
    assert.equal(mounted.current().data, null);
    assert.match(mounted.current().error, /Không tải/);
    await act(async () => mounted.current().reload());
    assert.deepEqual(mounted.current().data, { feed: page, count: 3 });
  } finally {
    await mounted.close();
  }
});

test("mark read is submitted once while busy and keeps confirmed unread count on failure", async () => {
  let finish;
  let sends = 0;
  const useNotifications = loadHook(
    "src/features/notifications/hooks/use-learner-notifications.ts",
    "useLearnerNotifications",
    {
      useApiResource,
      apiErrorMessage,
      fetchNotifications: async () => ok(page),
      fetchUnreadCount: async () => ok({ count: 3 }),
      markNotificationRead: () => {
        sends++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    }
  );
  const mounted = await mountHook(useNotifications, {});
  try {
    let first;
    await act(async () => {
      first = mounted.current().markRead("id");
      assert.equal(await mounted.current().markRead("id"), false);
    });
    assert.equal(mounted.current().isMutating, true);
    await act(async () => {
      finish(failed);
      await first;
    });
    assert.equal(sends, 1);
    assert.equal(mounted.current().data.count, 3);
    assert.match(mounted.current().actionError, /Không tải/);
    assert.equal(mounted.current().isMutating, false);
  } finally {
    await mounted.close();
  }
});

test("mark all read refreshes the authoritative feed and unread count", async () => {
  let count = 3;
  const useNotifications = loadHook(
    "src/features/notifications/hooks/use-learner-notifications.ts",
    "useLearnerNotifications",
    {
      useApiResource,
      apiErrorMessage,
      fetchNotifications: async () => ok(page),
      fetchUnreadCount: async () => ok({ count }),
      markAllNotificationsRead: async () => {
        count = 0;
        return ok(undefined);
      },
    }
  );
  const mounted = await mountHook(useNotifications, {});
  try {
    await act(async () => {
      assert.equal(await mounted.current().markAllRead(), true);
    });
    assert.equal(mounted.current().data.count, 0);
  } finally {
    await mounted.close();
  }
});

test("filter changes ignore an older feed response even when transport completes after abort", async () => {
  let finish;
  const useNotifications = loadHook(
    "src/features/notifications/hooks/use-learner-notifications.ts",
    "useLearnerNotifications",
    {
      useApiResource,
      apiErrorMessage,
      fetchNotifications: (filters) =>
        filters.page === 0
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : Promise.resolve(ok({ ...page, page: 1 })),
      fetchUnreadCount: async () => ok({ count: 2 }),
    }
  );
  const mounted = await mountHook(useNotifications, { page: 0 });
  try {
    await mounted.update({ page: 1 });
    assert.equal(mounted.current().data.feed.page, 1);
    await act(async () => finish(ok(page)));
    assert.equal(mounted.current().data.feed.page, 1);
  } finally {
    await mounted.close();
  }
});
