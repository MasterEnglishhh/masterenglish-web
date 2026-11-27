import { test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const createLatestRequestTracker = loadHook(
  "src/lib/latest-request.ts",
  "createLatestRequestTracker"
);
const ok = (data) => ({ success: true, data });
const page = (items, totalPages = 3) => ({
  items,
  page: 0,
  size: 50,
  totalItems: 125,
  totalPages,
  hasNext: true,
});
const wait = () => new Promise((resolve) => setTimeout(resolve, 270));
const storageQuota = {
  bucket: "media",
  usedBytes: 100,
  maxBytes: 200,
  usedFormatted: "100 B",
  limitFormatted: "200 B",
  percentUsed: 50,
  filesCount: 1,
};
const flag = {
  key: "ai_flag",
  name: "AI tutor",
  enabled: false,
  category: "AI",
  description: "Hỗ trợ AI",
  updatedAt: "2026-11-28T00:00:00Z",
};

async function setup(t, overrides = {}) {
  const useAdminSystem = loadHook(
    "src/features/admin/hooks/use-admin-system.ts",
    "useAdminSystem",
    {
      createLatestRequestTracker,
      fetchAiQuotaMetrics: async () => ok([]),
      fetchStorageQuota: async () => ok(storageQuota),
      fetchFeatureFlags: async () => ok([flag]),
      fetchAuditLogs: async () => ok(page([])),
      ...overrides,
    }
  );
  const fixture = await mountHook(useAdminSystem, {});
  t.after(() => fixture.close());
  await act(wait);
  return fixture;
}

test("quota lỗi không tạo số liệu giả, cho thử lại riêng và giữ dữ liệu đã tải khi lỗi lại", async (t) => {
  const offline = {
    success: false,
    error: { message: "Kho lưu trữ tạm gián đoạn" },
  };
  let response = offline;
  let aiRequests = 0;
  const fixture = await setup(t, {
    fetchStorageQuota: async () => response,
    fetchAiQuotaMetrics: async () => (aiRequests++, ok([])),
  });

  assert.equal(fixture.current().storage.data, null);
  assert.equal(fixture.current().storage.error, offline.error.message);
  assert.deepEqual(fixture.current().ai.data, []);
  response = ok(storageQuota);
  await act(() => fixture.current().storage.reload());
  response = offline;
  await act(() => fixture.current().storage.reload());
  assert.deepEqual(fixture.current().storage.data, storageQuota);
  assert.equal(fixture.current().storage.error, offline.error.message);
  assert.equal(aiRequests, 1);
});

test("nhật ký dùng trang 50 dòng và bỏ phản hồi từ bộ lọc trước", async (t) => {
  const requests = [];
  let release;
  const slow = new Promise((resolve) => (release = resolve));
  const fixture = await setup(t, {
    fetchAuditLogs: async (search, entity, index, size) => {
      requests.push([search, entity, index, size]);
      return search === "cũ" ? slow : ok(page([{ id: search || "đầu" }]));
    },
  });
  assert.equal(
    typeof fixture.current().setLogPage,
    "function",
    "Nhật ký cần điều khiển phân trang"
  );
  await act(async () => fixture.current().setLogPage(2));
  await act(wait);
  assert.deepEqual(requests.at(-1), ["", "ALL", 1, 50]);
  await act(async () => fixture.current().setLogSearch("cũ"));
  await act(wait);
  assert.deepEqual(requests.at(-1), ["cũ", "ALL", 0, 50]);
  await act(async () => fixture.current().setLogSearch("mới"));
  await act(wait);
  await act(async () => release(ok(page([{ id: "cũ" }]))));
  assert.deepEqual(fixture.current().logs.data.items, [{ id: "mới" }]);
});

test("mỗi cờ chỉ gửi một thay đổi và phản hồi máy chủ quyết định trạng thái", async (t) => {
  let release;
  let calls = 0;
  const pending = new Promise((resolve) => (release = resolve));
  const fixture = await setup(t, {
    updateFeatureFlag: () => (calls++, pending),
  });
  await act(async () => {
    void fixture.current().toggleFeatureFlag(flag.key);
    void fixture.current().toggleFeatureFlag(flag.key);
  });
  assert.equal(calls, 1);
  assert.equal(fixture.current().flags.data[0].enabled, false);
  await act(async () =>
    release(ok({ ...flag, enabled: true, updatedAt: "2026-11-29T00:00:00Z" }))
  );
  assert.equal(fixture.current().flags.data[0].enabled, true);
  assert.equal(
    fixture.current().flags.data[0].updatedAt,
    "2026-11-29T00:00:00Z"
  );
});
