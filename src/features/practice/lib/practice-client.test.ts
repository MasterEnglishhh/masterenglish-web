import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchAttempt,
  fetchPracticeSets,
  isActiveAttempt,
  isAttemptResult,
  startAttempt,
} from "./practice-client.ts";
const id = "10000000-0000-4000-8000-000000000001";
const option = "10000000-0000-4000-8000-000000000002";
const active = {
  id,
  category: "TOEIC",
  attemptMode: "PRACTICE",
  status: "IN_PROGRESS",
  source: { type: "PRACTICE_SET", practiceSetId: id, topicIds: [] },
  totalCount: 1,
  startedAt: "2026-11-28T00:00:00Z",
  lastActiveAt: "2026-11-28T00:00:00Z",
  deadlineAt: null,
  groups: [],
  questions: [
    {
      snapshotId: id,
      ordinal: 1,
      displayNumber: 1,
      groupSnapshotId: null,
      partNumber: 1,
      questionKind: "STANDARD",
      optionDisplay: "LABEL_ONLY",
      prompt: null,
      blankKey: null,
      insertSentence: null,
      refs: [],
      materials: [],
      options: [{ optionId: option, label: "A", body: null }],
    },
  ],
  savedAnswers: { [id]: { selectedOptionId: null, version: 0 } },
};
test("active contract rejects review fields and foreign media paths before rendering", () => {
  assert.equal(isActiveAttempt(active), true);
  assert.equal(
    isActiveAttempt({
      ...active,
      questions: [
        { ...active.questions[0], review: { correctOptionId: option } },
      ],
    }),
    false
  );
  assert.equal(
    isActiveAttempt({
      ...active,
      questions: [
        {
          ...active.questions[0],
          materials: [
            {
              materialKey: "audio",
              materialType: "AUDIO",
              position: 1,
              mediaUrl: "https://other.test/audio",
              body: {},
            },
          ],
        },
      ],
    }),
    false
  );
  assert.equal(isActiveAttempt({ ...active, savedAnswers: {} }), false);
  assert.equal(isAttemptResult(active), false);
});
test("invalid attempt IDs and invalid start sources never reach transport", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({});
  };
  try {
    assert.equal((await fetchAttempt("../../users/me")).ok, false);
    assert.equal(
      (
        await startAttempt(
          {
            source: { type: "PRACTICE_SET", practiceSetId: id },
            questionCount: 10,
          },
          id
        )
      ).ok,
      false
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("catalog sends encoded API filters and zero-based pagination", async () => {
  const original = globalThis.fetch;
  let path = "";
  globalThis.fetch = async (url) => {
    path = String(url);
    return Response.json({
      items: [],
      page: 2,
      size: 12,
      totalPages: 0,
      totalItems: 0,
      hasNext: false,
    });
  };
  try {
    assert.equal(
      (
        await fetchPracticeSets({
          q: "email & memo",
          partNumber: "7",
          difficulty: "HARD",
          page: 2,
        })
      ).ok,
      true
    );
    const query = new URL(path, "http://local.test").searchParams;
    assert.equal(query.get("category"), "TOEIC");
    assert.equal(query.get("q"), "email & memo");
    assert.equal(query.get("page"), "2");
  } finally {
    globalThis.fetch = original;
  }
});

test("structured materials reject malformed nodes instead of rendering incomplete question content", () => {
  const question = active.questions[0];
  const material = {
    materialKey: "passage",
    materialType: "RICH_TEXT",
    position: 1,
    mediaUrl: null,
    body: {
      document_kind: "EMAIL",
      blocks: [
        { type: "paragraph", inlines: [{ type: "blank", blank_key: "b1" }] },
      ],
    },
  };
  assert.equal(
    isActiveAttempt({
      ...active,
      questions: [{ ...question, materials: [material] }],
    }),
    true
  );
  assert.equal(
    isActiveAttempt({
      ...active,
      questions: [
        {
          ...question,
          materials: [
            {
              ...material,
              body: { blocks: [{ type: "html", html: "<b>answer</b>" }] },
            },
          ],
        },
      ],
    }),
    false
  );
});
