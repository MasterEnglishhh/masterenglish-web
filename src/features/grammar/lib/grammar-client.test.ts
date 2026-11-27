import test from "node:test";
import assert from "node:assert/strict";
import { fetchLesson, fetchTopics, isLesson } from "./grammar-client.ts";

test("lesson only accepts the five typed blocks with valid table rows", () => {
  const lesson = {
    id: "a",
    topicId: "b",
    title: "Present perfect",
    estimatedMinutes: 5,
    body: {
      blocks: [
        { type: "heading", text: "Cách dùng" },
        { type: "paragraph", text: "x < y" },
        { type: "note", text: "Lưu ý" },
        {
          type: "example",
          example_en: "I have worked.",
          example_vi: "Tôi đã làm việc.",
        },
        { type: "table", rows: [["have", "has"]] },
      ],
    },
  };
  assert.equal(isLesson(lesson), true);
  assert.equal(
    isLesson({
      ...lesson,
      body: { blocks: [{ type: "html", text: "<script>" }] },
    }),
    false
  );
  assert.equal(
    isLesson({
      ...lesson,
      body: { blocks: [{ type: "table", rows: [[{}]] }] },
    }),
    false
  );
});

test("invalid lesson URL identifier never reaches fetch", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  try {
    assert.equal((await fetchLesson("../../users/me")).ok, false);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("topics use API pagination and reject an invalid page body", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (path) => {
    requested = String(path);
    return Response.json({ items: null });
  };
  try {
    assert.equal((await fetchTopics(2)).ok, false);
    assert.match(requested, /page=2/);
  } finally {
    globalThis.fetch = original;
  }
});
