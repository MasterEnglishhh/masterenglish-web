import fs from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Biên dịch một hook TypeScript (đường dẫn từ gốc repo) và nạp nó với `react` thật.
 * Mọi import khác (client API, hook khác) nhận `mocks`, nên hook chạy mà không cần mạng.
 */
export function loadHook(file, exportName, mocks = {}) {
  const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const hookModule = { exports: {} };
  const localRequire = (name) => (name === "react" ? React : mocks);
  new Function("require", "module", "exports", compiled)(
    localRequire,
    hookModule,
    hookModule.exports
  );
  return hookModule.exports[exportName];
}

/** Gắn hook vào một component thử; `current()` trả về giá trị mới nhất mà hook trả ra. */
export async function mountHook(hook, props) {
  let current;
  function Harness(p) {
    current = hook(p);
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness, props));
  });
  return {
    current: () => current,
    update: (next) =>
      act(async () => {
        renderer.update(React.createElement(Harness, next));
      }),
    close: () => act(async () => renderer.unmount()),
  };
}

export { act };
