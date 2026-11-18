import { test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const filter = { q: "", cefrLevel: "", partOfSpeech: "" };
const word = (id) => ({ id, lemma: id, senses: [] });
const pageOf = (items, extra = {}) => ({
  success: true,
  data: { items, page: 0, size: 12, totalItems: items.length, totalPages: 1, hasNext: false, ...extra },
});

const loadWordList = (mocks) =>
  loadHook("src/features/vocabulary/hooks/use-word-list.ts", "useWordList", mocks);

function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

test("a slow response for an old filter never overwrites the newer one", async () => {
  const slow = deferred();
  const fetchWords = async ({ q }) => (q === "old" ? slow.promise : pageOf([word("new")]));
  const fixture = await mountHook(loadWordList({ fetchWords }), {
    mode: "words", page: 0, filter: { ...filter, q: "old" }, changePage: () => {},
  });
  try {
    await fixture.update({ mode: "words", page: 0, filter: { ...filter, q: "new" }, changePage: () => {} });
    assert.equal(fixture.current().data.words[0].id, "new");
    await act(async () => slow.resolve(pageOf([word("old")])));
    assert.equal(fixture.current().data.words[0].id, "new", "the old response must be dropped");
  } finally {
    await fixture.close();
  }
});

test("a page past the end steps back to the last page instead of showing an empty list", async () => {
  const requested = [];
  const fetchWords = async () => pageOf([], { page: 4, totalItems: 30, totalPages: 3 });
  const fixture = await mountHook(loadWordList({ fetchWords }), {
    mode: "words", page: 4, filter, changePage: (p) => requested.push(p),
  });
  try {
    assert.deepEqual(requested, [2]);
    assert.equal(fixture.current().data, null, "no data is shown for the invalid page");
  } finally {
    await fixture.close();
  }
});

test("saved mode reads the notebook and maps items to `saved`", async () => {
  const fetchSavedWords = async () => pageOf([{ wordSenseId: "s1", lemma: "keep" }]);
  const fixture = await mountHook(loadWordList({ fetchSavedWords }), {
    mode: "saved", page: 0, filter, changePage: () => {},
  });
  try {
    assert.equal(fixture.current().data.saved[0].wordSenseId, "s1");
    assert.deepEqual(fixture.current().data.words, []);
  } finally {
    await fixture.close();
  }
});

test("a failed request exposes the message and no data", async () => {
  const fetchWords = async () => ({ success: false, error: { message: "Dịch vụ gián đoạn" } });
  const fixture = await mountHook(loadWordList({ fetchWords }), {
    mode: "words", page: 0, filter, changePage: () => {},
  });
  try {
    assert.equal(fixture.current().error, "Dịch vụ gián đoạn");
    assert.equal(fixture.current().data, null);
  } finally {
    await fixture.close();
  }
});
