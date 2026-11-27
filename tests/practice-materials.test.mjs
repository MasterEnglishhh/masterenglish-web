import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) =>
      name === "./materials"
        ? load("../src/features/practice/components/materials.tsx")
        : require(name),
    mod,
    mod.exports
  );
  return mod.exports;
}
test("renders structured blanks, insertion positions and escaped text without exposing review transcripts", () => {
  const { Materials } = load(
    "../src/features/practice/components/materials.tsx"
  );
  const materials = [
    {
      materialKey: "email",
      materialType: "RICH_TEXT",
      position: 1,
      mediaUrl: null,
      body: {
        document_kind: "EMAIL",
        blocks: [
          {
            type: "paragraph",
            inlines: [
              { type: "text", text: "<script>alert(1)</script>" },
              { type: "blank", blank_key: "b1" },
              { type: "insert", position: 2 },
            ],
          },
        ],
      },
    },
    {
      materialKey: "transcript",
      materialType: "TRANSCRIPT",
      position: 2,
      mediaUrl: null,
      body: {
        segments: [{ type: "speech", speaker: "W", text: "private words" }],
      },
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(Materials, { materials, scope: "g" })
  );
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|private words/);
  assert.match(html, /b1/);
  assert.match(html, /\[2\]/);
  const review = renderToStaticMarkup(
    React.createElement(Materials, { materials, scope: "g", review: true })
  );
  assert.match(review, /private words/);
});

test("selected and correct answer styles retain separate CSS class tokens", () => {
  const { Questions } = load(
    "../src/features/practice/components/questions.tsx"
  );
  const question = {
    snapshotId: "q",
    displayNumber: 1,
    groupSnapshotId: null,
    partNumber: null,
    prompt: "At 9 AM",
    refs: [],
    materials: [],
    options: [{ optionId: "a", label: "A", body: "at" }],
    answer: { selectedOptionId: "a", isCorrect: true },
    review: {
      correctOptionId: "a",
      correctOptionLabel: "A",
      explanation: null,
      promptTranscript: null,
      optionTranscripts: [],
      evidence: [],
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(Questions, {
      groups: [],
      questions: [question],
      review: true,
    })
  );
  assert.match(
    html,
    /class="[^"]*\bpractice-option\b[^"]*\bselected\b[^"]*\bcorrect\b/
  );
});
