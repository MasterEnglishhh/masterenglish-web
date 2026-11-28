import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
let pathname;
let session;
function load(name) {
  const mod = { exports: {} };
  const source = readFileSync(
    new URL(`../src/features/auth/components/${name}.tsx`, import.meta.url),
    "utf8"
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", compiled)(
    (specifier) => {
      if (specifier.endsWith(".css")) return {};
      if (specifier === "next/link")
        return function Link({ children, ...props }) {
          return React.createElement("a", props, children);
        };
      if (specifier === "next/navigation")
        return { usePathname: () => pathname };
      if (specifier.endsWith("use-auth-session"))
        return { useAuthSession: () => session };
      if (specifier.endsWith("use-account-menu"))
        return {
          useAccountMenu: () => ({
            ...session,
            open: true,
            close() {},
            toggle() {},
            handleLogout() {},
          }),
        };
      if (specifier === "./workspace-switcher")
        return load("workspace-switcher");
      return require(specifier);
    },
    mod,
    mod.exports
  );
  return mod.exports;
}
function render(name, component, roles, path, isLoading = false) {
  pathname = path;
  session = {
    isLoading,
    user: roles && {
      id: "a",
      displayName: "Nguyễn An",
      email: "an@example.com",
      roles,
    },
  };
  return renderToStaticMarkup(React.createElement(load(name)[component]));
}

test("chuyển cùng một vị trí cho cả SYSTEM_ADMIN và CONTENT_ADMIN có quyền học", () => {
  for (const role of ["SYSTEM_ADMIN", "CONTENT_ADMIN"]) {
    const roles = [role, "LEARNER"];
    const learning = render(
      "workspace-switcher",
      "WorkspaceSwitcher",
      roles,
      "/learn/grammar"
    );
    assert.match(learning, /href="\/admin"/);
    assert.match(learning, /aria-label="Sang quản trị"/);
    const admin = render(
      "workspace-switcher",
      "WorkspaceSwitcher",
      roles,
      "/admin/content"
    );
    assert.match(admin, /href="\/learn"/);
    assert.match(admin, /aria-label="Về học tập"/);
  }
});

test("không hiện nút nếu thiếu quyền đích, chưa có phiên, đang tải hoặc ở trang công khai", () => {
  for (const [roles, path, loading] of [
    [["LEARNER"], "/learn", false],
    [["SYSTEM_ADMIN"], "/admin", false],
    [["CONTENT_ADMIN"], "/admin", false],
    [null, "/learn", false],
    [["SYSTEM_ADMIN", "LEARNER"], "/learn", true],
    [["SYSTEM_ADMIN", "LEARNER"], "/", false],
  ])
    assert.equal(
      render("workspace-switcher", "WorkspaceSwitcher", roles, path, loading),
      ""
    );
});

test("nhóm thao tác đặt nút chuyển trước menu tài khoản", () => {
  const html = render(
    "account-menu",
    "AccountActions",
    ["LEARNER", "SYSTEM_ADMIN"],
    "/learn"
  );
  assert.match(html, /class="header-account-actions"/);
  assert.ok(
    html.indexOf('aria-label="Sang quản trị"') <
      html.indexOf('aria-label="Tài khoản của Nguyễn An"')
  );
});

test("menu tài khoản không chứa lối chuyển trong workspace và hồ sơ theo đúng khu vực hiện tại", () => {
  for (const [path, href] of [
    ["/admin/content", "/admin/account"],
    ["/learn/grammar", "/learn/account"],
  ]) {
    const html = render(
      "account-menu",
      "AccountMenu",
      ["LEARNER", "SYSTEM_ADMIN"],
      path
    );
    assert.doesNotMatch(html, /Cổng quản trị|Về học tập|Sang quản trị/);
    assert.match(html, new RegExp(`href="${href}"`));
  }
  assert.match(
    render("account-menu", "AccountMenu", ["SYSTEM_ADMIN"], "/"),
    /Cổng quản trị/
  );
});
