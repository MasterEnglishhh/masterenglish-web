import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const createLatestRequestTracker = loadHook("src/lib/latest-request.ts", "createLatestRequestTracker");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DEBOUNCE = 320; // hook chờ 250ms sau mỗi lần đổi bộ lọc

const mounted = [];
afterEach(async () => {
  for (const fixture of mounted.splice(0)) await fixture.close();
});

const user = (id, status = "ACTIVE") => ({ id, displayName: id, email: `${id}@example.com`, roles: ["LEARNER"], status });
const page = (items, totalPages = 1) => ({ success: true, data: { items, totalItems: items.length, totalPages } });

async function setup(overrides = {}) {
  const calls = [];
  const mocks = {
    createLatestRequestTracker,
    fetchAdminUsers: async (filters) => {
      calls.push(["fetch", filters.search, filters.page]);
      return page([user("a1"), user("a2", "LOCKED")], 3);
    },
    lockAdminUser: async (id, reason) => (calls.push(["lock", id, reason]), { success: true, data: {} }),
    unlockAdminUser: async (id) => (calls.push(["unlock", id]), { success: true, data: {} }),
    revokeAdminUserSessions: async (id) => (calls.push(["revoke", id]), { success: true, data: { message: "" } }),
    updateAdminUserRoles: async (id, roles) => (calls.push(["roles", id, roles]), { success: true, data: {} }),
    ...overrides,
  };
  const useAdminUsers = loadHook("src/features/admin/hooks/use-admin-users.ts", "useAdminUsers", mocks);
  const fixture = await mountHook(useAdminUsers, {});
  mounted.push(fixture);
  await act(async () => wait(DEBOUNCE));
  const run = (fn) => act(async () => fn(fixture.current()));
  return { fixture, calls, run };
}

test("tải danh sách sau khoảng chờ và ghi tổng số, số trang", async () => {
  const { fixture, calls } = await setup();
  assert.deepEqual(calls, [["fetch", "", 1]]);
  assert.equal(fixture.current().users.length, 2);
  assert.equal(fixture.current().totalPages, 3);
  assert.equal(fixture.current().isLoading, false);
});

test("khóa tài khoản đang hoạt động: dùng lý do mặc định rồi tải lại danh sách", async () => {
  const { calls, run } = await setup();
  await run((h) => h.toggleLockUser(h.users[0]));
  assert.deepEqual(calls.slice(1, 3), [["lock", "a1", "Khóa thủ công bởi quản trị viên"], ["fetch", "", 1]]);
});

test("tài khoản đang khóa thì bấm sẽ mở khóa", async () => {
  const { calls, run } = await setup();
  await run((h) => h.toggleLockUser(h.users[1]));
  assert.deepEqual(calls[1], ["unlock", "a2"]);
});

test("khóa thất bại trả false với lý do lỗi và giữ danh sách", async () => {
  const { fixture, calls, run } = await setup({
    lockAdminUser: async () => ({ success: false, error: { message: "Không đủ quyền." } }),
  });
  await run(async (h) => assert.equal(await h.toggleLockUser(h.users[0]), false));
  assert.equal(fixture.current().mutationError, "Khóa tài khoản thất bại. Không đủ quyền.");
  assert.equal(calls.length, 1);
});

test("đổi vai trò về rỗng bị chặn ngay ở client", async () => {
  const { fixture, calls, run } = await setup();
  await run((h) => h.updateUserRoles("a1", []));
  assert.equal(fixture.current().mutationError, "Tài khoản phải có tối thiểu 1 vai trò.");
  assert.equal(calls.length, 1);
});

test("thu hồi phiên thành công: hiện thông báo mặc định khi máy chủ không kèm lời nhắn", async () => {
  const { fixture, run } = await setup();
  await run((h) => h.revokeUserSessions("a1"));
  assert.equal(fixture.current().notice, "Đã thu hồi toàn bộ phiên đăng nhập của người dùng.");
  assert.equal(fixture.current().error, null);
});

test("phản hồi chậm của bộ lọc cũ không ghi đè kết quả của bộ lọc mới", async () => {
  let release;
  const slow = new Promise((resolve) => (release = resolve));
  const { fixture, run } = await setup({
    fetchAdminUsers: async (filters) => (filters.search === "cu" ? slow : page([user("moi")])),
  });
  await run((h) => h.setFilters({ ...h.filters, search: "cu" }));
  await act(async () => wait(DEBOUNCE));
  await run((h) => h.setFilters({ ...h.filters, search: "moi" }));
  await act(async () => wait(DEBOUNCE));
  assert.deepEqual(fixture.current().users.map((u) => u.id), ["moi"]);
  await act(async () => release(page([user("cu")])));
  assert.deepEqual(fixture.current().users.map((u) => u.id), ["moi"]);
});

test("đổi bộ lọc người dùng đưa danh sách về trang đầu", async () => {
  const { fixture, calls, run } = await setup();
  await run((h) => h.setFilters({ ...h.filters, page: 3 }));
  await act(async () => wait(DEBOUNCE));
  await run((h) => h.setFilters({ ...h.filters, role: "CONTENT_ADMIN" }));
  await act(async () => wait(DEBOUNCE));
  assert.equal(fixture.current().filters.page, 1);
  assert.deepEqual(calls.at(-1), ["fetch", "", 1]);
});

test("trang người dùng vượt phạm vi được tải lại ở trang cuối", async () => {
  const pages = [];
  const { fixture, run } = await setup({
    fetchAdminUsers: async (filter) => (pages.push(filter.page), page(filter.page > 2 ? [] : [user("a1")], 2)),
  });
  await run((h) => h.setFilters({ ...h.filters, page: 3 }));
  await act(async () => wait(DEBOUNCE));
  await act(async () => wait(DEBOUNCE));
  assert.deepEqual(pages, [1, 3, 2]);
  assert.equal(fixture.current().filters.page, 2);
  assert.equal(fixture.current().users[0].id, "a1");
});
