import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  approveContentRevision,
  fetchAiQuotaMetrics,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchContentItems,
  fetchStorageQuota,
  lockAdminUser,
  rejectContentRevision,
  updateAdminUserRoles,
} from "./admin-client.ts";

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
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
        headers: (init?.headers ?? {}) as Record<string, string>,
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

      assert.deepEqual(
        calls.map((c) => `${c.method} ${c.url}`),
        [
          "PUT /api/v1/admin/users/u1/roles",
          "POST /api/v1/admin/users/u1/lock",
          "POST /api/v1/admin/content/revisions/r1/reject",
          "POST /api/v1/admin/content/revisions/r1/approve",
        ]
      );
      for (const call of calls)
        assert.equal(call.headers["X-XSRF-TOKEN"], "test-csrf");
      assert.deepEqual(calls[0].body, { roles: ["LEARNER", "CONTENT_ADMIN"] });
      assert.deepEqual(calls[1].body, {
        reason: "Vi phạm điều khoản",
        lockedUntil: null,
      });
      assert.deepEqual(calls[2].body, { reviewNote: "Cần thêm ví dụ" });
      assert.deepEqual(calls[3].body, { reviewNote: "Đạt chuẩn" });
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

test("audit log fetch omits ALL entityType, sets specific entityType, and trims search", () =>
  withFetch(
    () =>
      ok({
        items: [],
        page: 0,
        size: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
      }),
    async (calls) => {
      await fetchAuditLogs("  hành động  ", "ALL", 0, 10);
      await fetchAuditLogs("", "WORD", 1, 20);

      const first = new URL(calls[0].url, "http://localhost").searchParams;
      assert.equal(first.get("search"), "hành động");
      assert.equal(first.get("entityType"), null);
      assert.equal(first.get("page"), "0");
      assert.equal(first.get("size"), "10");

      const second = new URL(calls[1].url, "http://localhost").searchParams;
      assert.equal(second.get("search"), null);
      assert.equal(second.get("entityType"), "WORD");
      assert.equal(second.get("page"), "1");
      assert.equal(second.get("size"), "20");
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
