import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function accountSettings(dependencies) {
  const compiled = ts.transpileModule(
    readFileSync("src/features/auth/components/account-settings.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;
  const mod = { exports: {} };
  const stubs = {
    AuthField: (props) => React.createElement("input", props),
    StatusLine: () => null,
    PasswordChecklist: () => null,
    fieldError: () => null,
    checkPassword: () => ({ rules: [] }),
    ...dependencies,
  };
  new Function("require", "module", "exports", "React", compiled)(
    (name) => (name === "react" ? React : stubs),
    mod,
    mod.exports,
    React
  );
  return mod.exports.AccountSettings;
}

for (const operation of ["profile", "password"]) {
  test(`an unmounted ${operation} form aborts its request and ignores a late success`, async () => {
    let release;
    let signal;
    let submit;
    const accepted = [];
    const redirects = [];
    const originalWindow = globalThis.window;
    globalThis.window = {
      location: { replace: (value) => redirects.push(value) },
    };
    const user = { id: "account-a", roles: ["LEARNER"] };
    const pending = (_input, requestSignal) => {
      signal = requestSignal;
      return new Promise((resolve) => {
        release = resolve;
      });
    };
    const Component = accountSettings({
      useAuthSession: () => ({
        user,
        acceptLogin: (value) => accepted.push(value),
      }),
      updateProfile: pending,
      changePassword: pending,
    });
    let renderer;
    try {
      await act(async () => {
        renderer = create(React.createElement(Component));
      });
      await act(async () => {
        submit = renderer.root
          .findAllByType("form")
          [operation === "profile" ? 0 : 1].props.onSubmit({
            preventDefault() {},
          });
      });
      await act(async () => renderer.update(React.createElement("div")));
      assert.equal(signal?.aborted, true);
      await act(async () => {
        release({ success: true, data: user });
        await submit;
      });
      assert.deepEqual(accepted, []);
      assert.deepEqual(redirects, []);
    } finally {
      if (renderer) await act(async () => renderer.unmount());
      globalThis.window = originalWindow;
    }
  });
}
