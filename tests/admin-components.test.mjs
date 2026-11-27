import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create } from "react-test-renderer";
import ts from "typescript";
import { act, loadHook } from "./helpers/load-hook.mjs";

const createLatestRequestTracker = loadHook(
  "src/lib/latest-request.ts",
  "createLatestRequestTracker"
);
const useUserModalSave = loadHook(
  "src/features/admin/hooks/use-user-modal-save.ts",
  "useUserModalSave"
);

function loadComponent(file, name, dependencies) {
  const source = readFileSync(
    new URL(`../src/features/admin/components/${file}.tsx`, import.meta.url),
    "utf8"
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", "React", compiled)(
    (path) => (path === "react" ? React : dependencies),
    componentModule,
    componentModule.exports,
    React
  );
  return componentModule.exports[name];
}

async function render(t, Component, props) {
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Component, props));
  });
  t.after(() => act(async () => renderer.unmount()));
  return renderer.root;
}

const account = {
  id: "750e0ecd-0691-4156-babf-012cd9f299ba",
  email: "user@example.com",
  displayName: "Người dùng",
  firstName: null,
  lastName: null,
  phone: null,
  status: "ACTIVE",
  roles: ["LEARNER"],
  authVersion: 0,
  activeSessionsCount: 0,
  lastLoginAt: null,
  createdAt: "2026-11-28T00:00:00Z",
  lockReason: null,
  lockedUntil: null,
};
const dependencies = {
  createLatestRequestTracker,
  useUserModalSave,
  Dialog: ({ children, busy }) =>
    React.createElement("dialog", { "aria-busy": busy }, children),
  ErrorState: ({ message, onRetry }) =>
    React.createElement(
      "div",
      { role: "alert" },
      message,
      onRetry && React.createElement("button", { onClick: onRetry }, "Thử lại")
    ),
};
const button = (root, label) =>
  root.findAllByType("button").find((node) => node.children.join("") === label);

test("mở phân quyền tải vai trò mới nhất và chặn lưu cho đến khi tải thành công", async (t) => {
  const ids = [];
  let release;
  let detail = new Promise((resolve) => (release = resolve));
  const Modal = loadComponent("users/user-role-modal", "UserRoleModal", {
    ...dependencies,
    fetchAdminUser: (id) => (ids.push(id), detail),
  });
  const root = await render(t, Modal, {
    user: account,
    onClose: () => {},
    onSave: () => assert.fail("not editable yet"),
  });
  assert.deepEqual(ids, [account.id]);
  assert.ok(button(root, "Lưu thay đổi vai trò").props.disabled);
  await act(async () =>
    release({ success: false, error: { message: "Mất kết nối" } })
  );
  assert.ok(button(root, "Lưu thay đổi vai trò").props.disabled);
  detail = Promise.resolve({
    success: true,
    data: { ...account, roles: ["CONTENT_ADMIN"] },
  });
  await act(async () => button(root, "Thử lại").props.onClick());
  assert.deepEqual(
    root.findAllByType("input").map((input) => input.props.checked),
    [false, true, false]
  );
});

test("lưu khóa thất bại giữ lý do và hiển thị lỗi trong modal", async (t) => {
  let release;
  const saved = new Promise((resolve) => (release = resolve));
  let closed = 0;
  let sentReason;
  const Modal = loadComponent(
    "users/user-lock-modal",
    "UserLockModal",
    dependencies
  );
  const root = await render(t, Modal, {
    user: account,
    onClose: () => closed++,
    onConfirm: (_, reason) => ((sentReason = reason), saved),
  });
  await act(async () =>
    root
      .findByType("textarea")
      .props.onChange({ target: { value: "Lý do cần giữ" } })
  );
  await act(async () => {
    void button(root, "Xác nhận khóa").props.onClick();
  });
  assert.equal(closed, 0);
  assert.equal(root.findByType("textarea").props.disabled, true);
  await act(async () => release(false));
  assert.equal(sentReason, "Lý do cần giữ");
  assert.equal(closed, 0);
  assert.equal(root.findByType("textarea").props.value, "Lý do cần giữ");
  assert.ok(root.findAllByProps({ role: "alert" }).length > 0);
});

test("cổng quản trị phân biệt lỗi phiên, khách và các tổ hợp vai trò", async (t) => {
  let refetched = 0;
  const session = {
    user: null,
    isLoading: false,
    error: null,
    refreshSession: async () => refetched++,
  };
  const imports = {
    ...dependencies,
    useAuthSession: () => session,
    Mascot: () => null,
    default: ({ children, href }) =>
      React.createElement("a", { href }, children),
    __esModule: true,
  };
  const RequireAdmin = loadComponent("require-admin", "RequireAdmin", imports);
  const RequireSystemAdmin = loadComponent(
    "require-admin",
    "RequireSystemAdmin",
    imports
  );
  const content = React.createElement("div", { id: "admin-content" });
  for (const [Gate, roles, allowed] of [
    [RequireAdmin, ["LEARNER"], false],
    [RequireAdmin, ["CONTENT_ADMIN"], true],
    [RequireAdmin, ["SYSTEM_ADMIN"], true],
    [RequireSystemAdmin, ["CONTENT_ADMIN", "LEARNER"], false],
    [RequireSystemAdmin, ["SYSTEM_ADMIN", "LEARNER"], true],
  ]) {
    session.user = { ...account, roles };
    const root = await render(t, Gate, { children: content });
    assert.equal(
      root.findAllByProps({ id: "admin-content" }).length,
      allowed ? 1 : 0
    );
  }
  session.user = null;
  let root = await render(t, RequireAdmin, { children: content });
  assert.equal(
    root
      .findAllByType("a")
      .some((node) => node.props.href.startsWith("/login")),
    true
  );
  assert.doesNotMatch(
    JSON.stringify(root.findAllByType("span").map((span) => span.children)),
    /403/
  );
  session.error = "Mất kết nối";
  for (const Gate of [RequireAdmin, RequireSystemAdmin]) {
    root = await render(t, Gate, { children: content });
    await act(async () => button(root, "Thử lại").props.onClick());
  }
  assert.equal(refetched, 2);
});

test("chọn tạo bộ thẻ chỉ khả dụng cho quản trị viên có LEARNER", async (t) => {
  let roles = ["CONTENT_ADMIN"];
  const Modal = loadComponent(
    "content/create-content-modal",
    "CreateContentModal",
    {
      ...dependencies,
      useAuthSession: () => ({ user: { ...account, roles } }),
      useCreateContent: () => ({ contentType: "WORD" }),
      WordDraftFields: () => null,
      SourceSelect: () => null,
    }
  );
  for (const [combination, disabled] of [
    [["CONTENT_ADMIN"], true],
    [["SYSTEM_ADMIN"], true],
    [["CONTENT_ADMIN", "LEARNER"], false],
    [["SYSTEM_ADMIN", "LEARNER"], false],
  ]) {
    roles = combination;
    const root = await render(t, Modal, { onClose() {}, onCreated() {} });
    assert.equal(
      button(root, "Bộ thẻ (Flashcard Deck)").props.disabled,
      disabled
    );
    assert.equal(button(root, "Từ vựng (Word)").props.disabled, false);
  }
});
