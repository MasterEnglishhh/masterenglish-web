import { test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const loadCreateContent = (mocks) =>
  loadHook("src/features/admin/hooks/use-create-content.ts", "useCreateContent", mocks);
const event = { preventDefault() {} };

function setup(mocks) {
  const calls = { created: 0, closed: 0 };
  return mountHook(loadCreateContent(mocks), {
    onCreated: () => calls.created++,
    onClose: () => calls.closed++,
  }).then((fixture) => ({ fixture, calls }));
}

test("a word needs a lemma and a Vietnamese meaning before anything is sent", async () => {
  let sent = 0;
  const { fixture, calls } = await setup({ createWordDraft: async () => (sent++, { success: true }) });
  try {
    await act(async () => fixture.current().patchWord({ lemma: "keep" }));
    await act(async () => fixture.current().submit(event));
    assert.match(fixture.current().error, /Từ vựng và Nghĩa/);
    assert.equal(sent, 0);
    assert.equal(calls.closed, 0);
  } finally {
    await fixture.close();
  }
});

test("saving a word sends trimmed values, drops empty optionals, then closes", async () => {
  let payload;
  const { fixture, calls } = await setup({
    createWordDraft: async (p) => ((payload = p), { success: true }),
  });
  try {
    await act(async () => fixture.current().patchWord({ lemma: " keep ", meaningVi: " giữ ", exampleEn: " Keep it. " }));
    await act(async () => fixture.current().submit(event));
    assert.deepEqual(payload, {
      lemma: "keep", partOfSpeech: "NOUN", cefrLevel: "B1", meaningVi: "giữ",
      definitionEn: undefined, ipa: undefined, examplesEn: ["Keep it."], examplesVi: undefined,
    });
    assert.deepEqual(calls, { created: 1, closed: 1 });
  } finally {
    await fixture.close();
  }
});

test("a deck needs a title, and is created through the deck endpoint", async () => {
  let deck;
  const { fixture, calls } = await setup({
    createDeckDraft: async (p) => ((deck = p), { success: true }),
    createWordDraft: async () => assert.fail("must not create a word"),
  });
  try {
    await act(async () => fixture.current().setContentType("DECK"));
    await act(async () => fixture.current().submit(event));
    assert.match(fixture.current().error, /Tiêu đề bộ thẻ/);
    await act(async () => fixture.current().patchDeck({ title: " TOEIC 600 ", level: "B2" }));
    await act(async () => fixture.current().submit(event));
    assert.deepEqual(deck, { title: "TOEIC 600", description: undefined, level: "B2" });
    assert.deepEqual(calls, { created: 1, closed: 1 });
  } finally {
    await fixture.close();
  }
});

test("a server rejection keeps the dialog open and shows the reason", async () => {
  const { fixture, calls } = await setup({
    createWordDraft: async () => ({ success: false, error: { message: "Trùng từ vựng" } }),
  });
  try {
    await act(async () => fixture.current().patchWord({ lemma: "keep", meaningVi: "giữ" }));
    await act(async () => fixture.current().submit(event));
    assert.equal(fixture.current().error, "Trùng từ vựng");
    assert.equal(fixture.current().isSubmitting, false);
    assert.deepEqual(calls, { created: 0, closed: 0 });
  } finally {
    await fixture.close();
  }
});
