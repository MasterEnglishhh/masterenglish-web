import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchNotifications,
  fetchAdminDeliveries,
  fetchAdminReminderHistory,
  fetchReminderHistory,
  fetchReminderRules,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  updateReminderRule,
  validatePreferences,
} from "./notification-client.ts";

const preferences = {
  inAppEnabled: true,
  emailEnabled: false,
  contentNotificationsEnabled: true,
  dailyReminderTime: "18:00",
  timezone: "Asia/Ho_Chi_Minh",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};
test("quiet hours cross midnight and require a distinct complete pair", () => {
  assert.equal(validatePreferences(preferences), null);
  assert.ok(validatePreferences({ ...preferences, quietHoursEnd: null }));
  assert.ok(validatePreferences({ ...preferences, quietHoursEnd: "22:00" }));
  assert.ok(validatePreferences({ ...preferences, timezone: "+07:00" }));
  assert.ok(
    validatePreferences({ ...preferences, dailyReminderTime: "25:00" })
  );
});
test("invalid preferences are rejected before sending a request", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  try {
    assert.equal(
      (
        await updateNotificationPreferences({
          ...preferences,
          timezone: "invalid/timezone",
        })
      ).ok,
      false
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("feed encodes filters and rejects broken delivery JSON", async () => {
  const original = globalThis.fetch;
  let url = "";
  globalThis.fetch = async (path) => {
    url = String(path);
    return Response.json({
      items: [null],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    });
  };
  try {
    assert.equal(
      (await fetchNotifications({ page: 2, unreadOnly: true })).ok,
      false
    );
    assert.match(url, /page=2/);
    assert.match(url, /unreadOnly=true/);
  } finally {
    globalThis.fetch = original;
  }
});

const id = "e9970000-0001-4000-8000-000000000001";
const createdAt = "2026-11-28T00:00:00Z";
const rule = {
  id,
  code: "DAILY_GOAL",
  enabled: true,
  minimumGapMinutes: 60,
  createdAt,
};
const outcome = {
  channel: "EMAIL",
  status: "SENT",
  attemptCount: 1,
  lastFailureCode: null,
  sentAt: createdAt,
  finishedAt: createdAt,
};
const page = (items: unknown[]) => ({
  items,
  page: 0,
  size: 20,
  totalItems: items.length,
  totalPages: items.length ? 1 : 0,
  hasNext: false,
});

async function withFetch(
  handler: (path: string, init?: RequestInit) => Response,
  run: () => Promise<void>
) {
  const original = globalThis.fetch;
  globalThis.fetch = async (path, init) =>
    String(path).endsWith("/auth/csrf")
      ? Response.json({ headerName: "X-XSRF-TOKEN", token: "csrf" })
      : handler(String(path), init);
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}

test("preference PUT sends only request fields and uses CSRF", () =>
  withFetch(
    (path, init) => {
      assert.equal(path, "/api/v1/notifications/preferences");
      assert.equal(init?.method, "PUT");
      assert.equal(new Headers(init?.headers).get("X-XSRF-TOKEN"), "csrf");
      assert.deepEqual(JSON.parse(String(init?.body)), preferences);
      return Response.json({ ...preferences, updatedAt: createdAt });
    },
    async () => {
      const saved = { ...preferences, updatedAt: createdAt };
      assert.equal((await updateNotificationPreferences(saved)).ok, true);
    }
  ));

test("read endpoints require UUID and POST with a bodyless 204 response", async () => {
  let calls = 0;
  await withFetch(
    (path, init) => {
      calls++;
      assert.equal(init?.method, "POST");
      assert.ok(
        path === `/api/v1/notifications/${id}/read` ||
          path === "/api/v1/notifications/read-all"
      );
      assert.equal(init?.body, undefined);
      return new Response(null, { status: 204 });
    },
    async () => {
      assert.equal((await markNotificationRead("../read-all")).ok, false);
      assert.equal(calls, 0);
      assert.equal((await markNotificationRead(id)).ok, true);
      assert.equal((await markAllNotificationsRead()).ok, true);
      assert.equal(calls, 2);
    }
  );
});

test("rule edits respect backend upper bound and only send supported fields", async () => {
  let calls = 0;
  await withFetch(
    (path, init) => {
      calls++;
      assert.equal(path, `/api/v1/admin/notifications/rules/${id}`);
      assert.equal(init?.method, "PUT");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        enabled: false,
        minimumGapMinutes: 43200,
      });
      return Response.json({
        ...rule,
        enabled: false,
        minimumGapMinutes: 43200,
      });
    },
    async () => {
      assert.equal(
        (
          await updateReminderRule(id, {
            enabled: true,
            minimumGapMinutes: 43201,
          })
        ).ok,
        false
      );
      assert.equal(
        (
          await updateReminderRule(id, {
            enabled: true,
            minimumGapMinutes: 0.5,
          })
        ).ok,
        false
      );
      assert.equal(calls, 0);
      assert.equal(
        (
          await updateReminderRule(id, {
            enabled: false,
            minimumGapMinutes: 43200,
          })
        ).ok,
        true
      );
    }
  );
});

test("history filters are encoded, unsupported query fields stay off the endpoint", () =>
  withFetch(
    (path) => {
      const url = new URL(path, "http://localhost");
      assert.equal(url.pathname, "/api/v1/notifications/reminders/history");
      assert.equal(url.searchParams.get("ruleCode"), "A&B");
      assert.equal(url.searchParams.get("from"), "2026-11-28T00:00:00+07:00");
      assert.equal(url.searchParams.has("userId"), false);
      return Response.json(
        page([
          {
            notificationId: id,
            type: "DAILY_GOAL",
            title: "Nhắc học",
            body: "Học cùng nhau",
            targetUrl: null,
            readAt: null,
            createdAt,
            ruleCode: "DAILY_GOAL",
            deliveries: [outcome],
          },
        ])
      );
    },
    async () => {
      assert.equal(
        (
          await fetchReminderHistory({
            ruleCode: "A&B",
            userId: id,
            from: "2026-11-28T00:00:00+07:00",
          })
        ).ok,
        true
      );
    }
  ));

test("response validators reject malformed counts, rules, delivery outcomes and history identifiers", async () => {
  await withFetch(
    () => Response.json({ count: -1 }),
    async () => assert.equal((await fetchUnreadCount()).ok, false)
  );
  await withFetch(
    () => Response.json([{ ...rule, enabled: "true" }]),
    async () => assert.equal((await fetchReminderRules()).ok, false)
  );
  await withFetch(
    () =>
      Response.json(
        page([
          {
            ...outcome,
            id,
            notificationId: id,
            userId: id,
            type: "DAILY_GOAL",
            nextRetryAt: null,
            providerMessageId: null,
            createdAt,
            updatedAt: createdAt,
            attemptCount: "1",
          },
        ])
      ),
    async () => assert.equal((await fetchAdminDeliveries()).ok, false)
  );
  await withFetch(
    () =>
      Response.json(
        page([
          {
            notificationId: id,
            userId: "wrong",
            type: "DAILY_GOAL",
            reminderRuleId: id,
            reminderRuleCode: "DAILY_GOAL",
            targetUrl: null,
            readAt: null,
            createdAt,
            deliveries: [outcome],
          },
        ])
      ),
    async () => assert.equal((await fetchAdminReminderHistory()).ok, false)
  );
});
