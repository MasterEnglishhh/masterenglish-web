import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  approveContentRevision,
  fetchAiQuotaMetrics,
  fetchAdminUsers,
  fetchContentItems,
  fetchStorageQuota,
  lockAdminUser,
  rejectContentRevision,
  updateAdminUserRoles,
  updateFeatureFlag,
} from "./admin-client.ts";

interface Call {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
}

/** Thay `fetch`; mọi yêu cầu (trừ CSRF) được ghi lại và trả về bởi `handler`. */
function withFetch(
  handler: (call: Call, index: number) => Response,
  run: (calls: Call[]) => Promise<void>
) {
  const original = globalThis.fetch;
  const calls: Call[] = [];
  globalThis.fetch = mock.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/csrf"))
        return new Response(
          JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
          { status: 200 }
        );
      const call: Call = {
        url,
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      };
      calls.push(call);
      return handler(call, calls.length - 1);
    }
  );
  return run(calls).finally(() => {
    globalThis.fetch = original;
  });
}

const emptyPage = {
  items: [],
  page: 0,
  size: 10,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
};
const ok = (body: unknown = emptyPage) =>
  new Response(JSON.stringify(body), { status: 200 });

test("admin server failures do not expose internal details or messages", () =>
  withFetch(
    () =>
      new Response(
        JSON.stringify({
          code: "INTERNAL_ERROR",
          detail: "jdbc password=secret",
          message: "internal host",
        }),
        { status: 500 }
      ),
    async () => {
      const result = await fetchStorageQuota();
      assert.equal(result.success, false);
      if (!result.success) {
        assert.doesNotMatch(result.error.message, /jdbc|secret|internal host/);
        assert.equal(result.error.retryable, true);
      }
    }
  ));

test("user list converts the 1-based UI page to the 0-based API page and omits ALL filters", () =>
  withFetch(
    () => ok(),
    async (calls) => {
      await fetchAdminUsers({
        search: "  an  ",
        role: "ALL",
        status: "LOCKED",
        page: 3,
        pageSize: 25,
      });
      const params = new URL(calls[0].url, "http://x").searchParams;
      assert.equal(
        new URL(calls[0].url, "http://x").pathname,
        "/api/v1/admin/users"
      );
      assert.equal(params.get("search"), "an");
      assert.equal(params.get("role"), null);
      assert.equal(params.get("status"), "LOCKED");
      assert.equal(params.get("page"), "2");
      assert.equal(params.get("size"), "25");
    }
  ));

test("content list filters by contentType (WORD | DECK) and never sends a module", () =>
  withFetch(
    () => ok(),
    async (calls) => {
      await fetchContentItems({
        search: "",
        contentType: "DECK",
        status: "IN_REVIEW",
        page: 1,
        pageSize: 10,
      });
      await fetchContentItems({
        search: "",
        contentType: "ALL",
        status: "ALL",
        page: 1,
        pageSize: 10,
      });
      const first = new URL(calls[0].url, "http://x").searchParams;
      assert.equal(first.get("contentType"), "DECK");
      assert.equal(first.get("status"), "IN_REVIEW");
      assert.equal(first.get("page"), "0");
      const second = new URL(calls[1].url, "http://x").searchParams;
      assert.equal(second.get("contentType"), null);
      assert.equal(second.get("status"), null);
      assert.equal(second.get("module"), null);
    }
  ));

test("mutations send the CSRF header and the body shapes from the admin contract", () =>
  withFetch(
    () => ok({}),
    async (calls) => {
      await updateAdminUserRoles("u1", ["LEARNER", "CONTENT_ADMIN"]);
      await lockAdminUser("u1", "Vi phạm điều khoản");
      await rejectContentRevision("r1", "Cần thêm ví dụ");
      await approveContentRevision("r1", "Đạt chuẩn");
      await updateFeatureFlag("ai_tutor_chat", false);

      assert.deepEqual(
        calls.map((c) => `${c.method} ${c.url}`),
        [
          "PUT /api/v1/admin/users/u1/roles",
          "POST /api/v1/admin/users/u1/lock",
          "POST /api/v1/admin/content/revisions/r1/reject",
          "POST /api/v1/admin/content/revisions/r1/approve",
          "PUT /api/v1/admin/system/feature-flags/ai_tutor_chat",
        ]
      );
      for (const call of calls)
        assert.equal(call.headers.get("X-XSRF-TOKEN"), "test-csrf");
      assert.deepEqual(calls[0].body, { roles: ["LEARNER", "CONTENT_ADMIN"] });
      assert.deepEqual(calls[1].body, {
        reason: "Vi phạm điều khoản",
        lockedUntil: null,
      });
      assert.deepEqual(calls[2].body, { reviewNote: "Cần thêm ví dụ" });
      assert.deepEqual(calls[3].body, { reviewNote: "Đạt chuẩn" });
      assert.deepEqual(calls[4].body, { enabled: false });
    }
  ));

test("quota endpoints use the /quotas/* paths from the contract", () =>
  withFetch(
    () => ok({}),
    async (calls) => {
      await fetchStorageQuota();
      await fetchAiQuotaMetrics();
      assert.equal(calls[0].url, "/api/v1/admin/system/quotas/storage");
      assert.equal(calls[1].url, "/api/v1/admin/system/quotas/ai");
    }
  ));

test("quota trả 200 với DTO sai được báo lỗi", () =>
  withFetch(
    () => ok({ bucket: "media", percentUsed: "10" }),
    async () => {
      const result = await fetchStorageQuota();
      assert.ok(!result.success);
      assert.equal(result.error.code, "INVALID_RESPONSE");
    }
  ));

test("chỉ gửi khóa cờ trong một đoạn URL", () =>
  withFetch(
    () => ok({}),
    async (calls) => {
      await updateFeatureFlag("ai /flag?x", false);
      assert.equal(
        calls[0].url,
        "/api/v1/admin/system/feature-flags/ai%20%2Fflag%3Fx"
      );
    }
  ));

test("a 403 keeps the backend's reason and is never retried as an expired session", () =>
  withFetch(
    () =>
      new Response(
        JSON.stringify({
          code: "ACCESS_DENIED",
          detail: "Bạn không có quyền quản trị.",
        }),
        { status: 403 }
      ),
    async (calls) => {
      const result = await fetchAdminUsers({
        search: "",
        role: "ALL",
        status: "ALL",
        page: 1,
        pageSize: 10,
      });
      assert.equal(result.success, false);
      if (result.success) return;
      assert.equal(result.error.status, 403);
      assert.equal(result.error.message, "Bạn không có quyền quản trị.");
      assert.equal(calls.length, 1);
    }
  ));

test("a network failure becomes a retryable NETWORK_ERROR", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = mock.fn(async () => {
    throw new TypeError("offline");
  });
  try {
    const result = await fetchStorageQuota();
    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, "NETWORK_ERROR");
    assert.equal(result.error.retryable, true);
  } finally {
    globalThis.fetch = original;
  }
});

test("a 401 that persists after a successful refresh is reported as an expired session", async () => {
  const original = globalThis.fetch;
  let refreshes = 0;
  let resourceCalls = 0;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/users/me")) return new Response(null, { status: 401 });
    if (url.includes("/auth/csrf"))
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
        { status: 200 }
      );
    if (url.includes("/auth/refresh")) {
      refreshes++;
      return new Response(null, { status: 204 });
    }
    resourceCalls++;
    return new Response(null, { status: 401 });
  });
  try {
    const result = await fetchStorageQuota();
    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, "UNAUTHENTICATED");
    assert.equal(result.error.status, 401);
    assert.equal(refreshes, 1, "refresh exactly once, never a loop");
    assert.equal(resourceCalls, 2, "the request is retried only once");
  } finally {
    globalThis.fetch = original;
  }
});
