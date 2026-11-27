import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const require = createRequire(import.meta.url);
const ok = (data) => ({ ok: true, status: 200, data });
const failed = {
  ok: false,
  status: 500,
  reason: "http",
  problem: null,
  retryAfterSeconds: null,
};
const preferences = {
  inAppEnabled: true,
  emailEnabled: false,
  contentNotificationsEnabled: true,
  dailyReminderTime: "18:00",
  timezone: "Asia/Ho_Chi_Minh",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  updatedAt: null,
};
const rule = {
  id: "e9970000-0001-4000-8000-000000000001",
  code: "DAILY_GOAL",
  enabled: true,
  minimumGapMinutes: 60,
  createdAt: "2026-11-28T00:00:00Z",
};

function loadComponent(file, name, api, roles = ["LEARNER"]) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const componentModule = { exports: {} };
    cache.set(absolute, componentModule);
    const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier.endsWith(".css")) return {};
      if (specifier === "@/features/auth")
        return {
          useAuthSession: () => ({
            user: { roles },
            isLoading: false,
            error: null,
          }),
          RequireAuth: ({ children }) => children,
          getSafeRedirectUrl: load("src/features/auth/lib/redirect.ts")
            .getSafeRedirectUrl,
        };
      if (specifier.endsWith("notification-client"))
        return {
          ...load("src/features/notifications/lib/notification-validation.ts"),
          ...api,
        };
      if (specifier === "next/link")
        return {
          __esModule: true,
          default: ({ children, ...props }) =>
            React.createElement("a", props, children),
        };
      if (!specifier.startsWith(".") && !specifier.startsWith("@/"))
        return require(specifier);
      const target = specifier.startsWith("@/")
        ? path.resolve("src", specifier.slice(2))
        : path.resolve(path.dirname(absolute), specifier);
      const resolved = [target, `${target}.ts`, `${target}.tsx`].find(
        (p) => fs.existsSync(p) && fs.statSync(p).isFile()
      );
      assert.ok(resolved, `Missing module: ${target}`);
      return load(resolved);
    };
    new Function("require", "module", "exports", compiled)(
      localRequire,
      componentModule,
      componentModule.exports
    );
    return componentModule.exports;
  }
  return load(`src/features/notifications/components/${file}.tsx`)[name];
}
async function render(t, Component) {
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Component));
  });
  t.after(() => act(async () => renderer.unmount()));
  return renderer;
}
const text = (renderer) => JSON.stringify(renderer.toJSON());
const input = (renderer, name) => renderer.root.findByProps({ name });

test("preferences reject an incomplete quiet-hours pair without losing draft values", async (t) => {
  let saves = 0;
  const Component = loadComponent(
    "notification-preferences-card",
    "NotificationPreferencesCard",
    {
      fetchNotificationPreferences: async () => ok(preferences),
      updateNotificationPreferences: async () => {
        saves++;
        return ok(preferences);
      },
    }
  );
  const renderer = await render(t, Component);
  await act(async () =>
    input(renderer, "quietHoursEnd").props.onChange({ target: { value: "" } })
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.equal(saves, 0);
  assert.match(text(renderer), /đủ giờ bắt đầu/);
  assert.equal(input(renderer, "quietHoursStart").props.value, "22:00");
});

test("failed preference save keeps edits and allows retry; success uses server canonical values", async (t) => {
  let saves = 0;
  const Component = loadComponent(
    "notification-preferences-card",
    "NotificationPreferencesCard",
    {
      fetchNotificationPreferences: async () => ok(preferences),
      updateNotificationPreferences: async (body) =>
        ++saves === 1
          ? failed
          : ok({
              ...body,
              timezone: "Asia/Ho_Chi_Minh",
              updatedAt: "2026-11-28T01:00:00Z",
            }),
    }
  );
  const renderer = await render(t, Component);
  await act(async () =>
    input(renderer, "timezone").props.onChange({
      target: { value: "Asia/Saigon" },
    })
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.equal(input(renderer, "timezone").props.value, "Asia/Saigon");
  assert.equal(
    renderer.root.findAllByProps({ role: "alert" }).length > 0,
    true
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.equal(input(renderer, "timezone").props.value, "Asia/Ho_Chi_Minh");
  assert.match(text(renderer), /Đã lưu/);
});

test("preferences block duplicate submissions until the save finishes", async (t) => {
  let saves = 0;
  let finish;
  const Component = loadComponent(
    "notification-preferences-card",
    "NotificationPreferencesCard",
    {
      fetchNotificationPreferences: async () => ok(preferences),
      updateNotificationPreferences: () => {
        saves++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    }
  );
  const renderer = await render(t, Component);
  let first;
  await act(async () => {
    first = renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.equal(saves, 1);
  assert.equal(renderer.root.findByType("fieldset").props.disabled, true);
  await act(async () => {
    finish(ok(preferences));
    await first;
  });
});

test("content admins cannot mount notification monitoring or start its API requests", async (t) => {
  let calls = 0;
  const Component = loadComponent(
    "admin-notifications",
    "AdminNotifications",
    {
      fetchAdminDeliveries: () => {
        calls++;
        return Promise.resolve(ok({ items: [] }));
      },
    },
    ["CONTENT_ADMIN"]
  );
  const renderer = await render(t, Component);
  assert.match(text(renderer), /SYSTEM_ADMIN/);
  assert.equal(calls, 0);
});

test("reminder rule rejects gaps outside backend bounds and only applies confirmed updates", async (t) => {
  const sent = [];
  const Component = loadComponent(
    "reminder-rules",
    "ReminderRules",
    {
      fetchReminderRules: async () => ok([rule]),
      updateReminderRule: async (id, body) => {
        sent.push({ id, body });
        return ok({ ...rule, ...body });
      },
    },
    ["SYSTEM_ADMIN"]
  );
  const renderer = await render(t, Component);
  await act(async () =>
    input(renderer, "minimumGapMinutes").props.onChange({
      target: { value: "43201" },
    })
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.equal(sent.length, 0);
  assert.equal(
    renderer.root.findAllByProps({ role: "alert" }).length > 0,
    true
  );
  await act(async () =>
    input(renderer, "minimumGapMinutes").props.onChange({
      target: { value: "90" },
    })
  );
  await act(async () =>
    input(renderer, "enabled").props.onChange({ target: { checked: false } })
  );
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} })
  );
  assert.deepEqual(sent, [
    { id: rule.id, body: { enabled: false, minimumGapMinutes: 90 } },
  ]);
  assert.match(text(renderer), /Đã lưu/);
});
