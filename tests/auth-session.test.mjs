import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("switching the authenticated account clears private feature state while a profile refresh preserves edits", async () => {
  const original = { window: globalThis.window, document: globalThis.document };
  globalThis.window = Object.assign(new EventTarget(), {
    setInterval,
    clearInterval,
  });
  globalThis.document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  let account = { id: "account-a", roles: ["LEARNER"] };
  const source = readFileSync(
    new URL(
      "../src/features/auth/components/auth-session-provider.tsx",
      import.meta.url
    ),
    "utf8"
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", "React", compiled)(
    (name) =>
      name === "react"
        ? React
        : {
            sessionIdentity: { userId: null },
            getCurrentUser: async () => account,
            logout: async () => true,
          },
    mod,
    mod.exports,
    React
  );
  const { AuthSessionProvider, AuthSessionContext } = mod.exports;
  let session;
  function PrivateFeature() {
    session = React.useContext(AuthSessionContext);
    const [draft, setDraft] = React.useState("");
    return React.createElement(
      "button",
      { onClick: () => setDraft("private answer from A") },
      `${session.user?.id}:${draft}`
    );
  }
  let renderer;
  try {
    await act(async () => {
      renderer = create(
        React.createElement(
          AuthSessionProvider,
          null,
          React.createElement(PrivateFeature)
        )
      );
    });
    await act(async () => renderer.root.findByType("button").props.onClick());
    await act(async () => session.refreshSession());
    assert.match(
      renderer.root.findByType("button").children.join(""),
      /private answer from A/
    );
    account = { id: "account-b", roles: ["LEARNER"] };
    await act(async () => session.refreshSession());
    assert.equal(
      renderer.root.findByType("button").children.join(""),
      "account-b:"
    );
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    Object.assign(globalThis, original);
  }
});
