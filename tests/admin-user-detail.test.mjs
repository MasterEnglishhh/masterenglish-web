import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const mounted = [];

afterEach(async () => {
  for (const fixture of mounted.splice(0)) await fixture.close();
});

const listUser = (id) => ({
  id,
  displayName: `Người dùng ${id}`,
  email: `${id}@example.com`,
  firstName: null,
  lastName: null,
  phone: null,
  status: "ACTIVE",
  roles: ["LEARNER"],
  authVersion: 1,
  activeSessionsCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  lastLoginAt: null,
});

async function setup(fetchAdminUserDetail, user = listUser("u1")) {
  const useAdminUserDetail = loadHook(
    "src/features/admin/hooks/use-admin-user-detail.ts",
    "useAdminUserDetail",
    { fetchAdminUserDetail }
  );
  const fixture = await mountHook(useAdminUserDetail, user);
  mounted.push(fixture);
  await act(async () => wait(10));
  return fixture;
}

test("tải chi tiết mới nhất đúng người dùng và dùng vai trò từ máy chủ", async () => {
  const calls = [];
  const fixture = await setup(async (id) => {
    calls.push(id);
    return {
      success: true,
      data: {
        ...listUser(id),
        roles: ["LEARNER", "CONTENT_ADMIN"],
        activeSessionsCount: 2,
      },
    };
  });

  assert.deepEqual(calls, ["u1"]);
  assert.equal(fixture.current().status, "ready");
  assert.deepEqual(fixture.current().detail.roles, [
    "LEARNER",
    "CONTENT_ADMIN",
  ]);
  assert.equal(fixture.current().detail.activeSessionsCount, 2);
});

test("khi tải lỗi vẫn hiển thị dữ liệu danh sách và cho thử lại", async () => {
  let attempts = 0;
  const fixture = await setup(async (id) => {
    attempts += 1;
    if (attempts === 1) {
      return {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "lỗi", status: 500 },
      };
    }
    return {
      success: true,
      data: { ...listUser(id), roles: ["SYSTEM_ADMIN"] },
    };
  });

  assert.equal(fixture.current().status, "error");
  assert.deepEqual(fixture.current().detail, listUser("u1"));

  await act(async () => fixture.current().reload());
  await act(async () => wait(10));

  assert.equal(attempts, 2);
  assert.equal(fixture.current().status, "ready");
  assert.deepEqual(fixture.current().detail.roles, ["SYSTEM_ADMIN"]);
});

test("không dùng chi tiết của người dùng trước khi chuyển sang người khác", async () => {
  const fixture = await setup(async (id) => ({
    success: true,
    data: {
      ...listUser(id),
      roles: [id === "u2" ? "CONTENT_ADMIN" : "LEARNER"],
    },
  }));
  assert.equal(fixture.current().detail.id, "u1");

  await fixture.update(listUser("u2"));
  await act(async () => wait(10));

  assert.equal(fixture.current().detail.id, "u2");
  assert.deepEqual(fixture.current().detail.roles, ["CONTENT_ADMIN"]);
});

test("chỉ cho lưu vai trò khi chi tiết đã tải xong hoặc người quản trị đã tự chọn lại", () => {
  const canSaveUserRoles = loadHook(
    "src/features/admin/hooks/use-admin-user-detail.ts",
    "canSaveUserRoles",
    {}
  );

  assert.equal(canSaveUserRoles(null, "ready"), true);
  assert.equal(canSaveUserRoles(null, "loading"), false);
  assert.equal(canSaveUserRoles(null, "error"), false);
  assert.equal(canSaveUserRoles(["LEARNER"], "loading"), true);
  assert.equal(canSaveUserRoles(["LEARNER"], "error"), true);
});
