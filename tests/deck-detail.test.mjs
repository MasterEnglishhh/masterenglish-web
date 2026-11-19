import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { loadHook } from "./helpers/load-hook.mjs";

const mockDeckDetail = {
  id: "deck-123",
  title: "Chủ đề Kinh doanh & Đàm phán",
  description: "Bộ từ vựng tiếng Anh giao tiếp công việc.",
  level: "B2",
  cardCount: 20,
  publishedRevisionId: "rev-uuid-456",
  createdAt: "2026-11-19T00:00:00Z",
};

const mockPreviewCards = [
  {
    deckId: "deck-123",
    deckRevisionId: "rev-uuid-456",
    position: 1,
    wordSenseId: "sense-1",
    wordId: "word-1",
    wordRevisionId: "wrev-1",
    lemma: "collaborate",
    ipa: "/kəˈlæbəreɪt/",
    partOfSpeech: "VERB",
    cefrLevel: "B2",
    meaningVi: "hợp tác, cộng tác",
    definitionEn: "to work jointly on an activity or project",
    examples: [],
    audioUrl: null,
    isSaved: true,
    progress: {
      repetitions: 3,
      intervalDays: 6,
      easeFactor: 2.5,
      dueAt: "2026-11-25T00:00:00Z",
      version: 1,
    },
  },
];

const loadDeckDetailHook = (mocks) =>
  loadHook("src/features/vocabulary/hooks/use-deck-detail.ts", "useDeckDetail", mocks);

async function mountDeckDetail(hook, deckId) {
  let current;
  function Harness({ id }) {
    current = hook(id);
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness, { id: deckId }));
  });
  return {
    current: () => current,
    update: (nextId) =>
      act(async () => {
        renderer.update(React.createElement(Harness, { id: nextId }));
      }),
    close: () => act(async () => renderer.unmount()),
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

test("useDeckDetail hook loads deck details and words preview in parallel", async () => {
  let deckFetched = false;
  let wordsFetched = false;

  const fetchDeckDetail = async (id) => {
    deckFetched = true;
    assert.equal(id, "deck-123");
    return { success: true, data: mockDeckDetail };
  };

  const fetchDeckWords = async (id, params) => {
    wordsFetched = true;
    assert.equal(id, "deck-123");
    assert.equal(params?.size, 5);
    return {
      success: true,
      data: {
        items: mockPreviewCards,
        page: 0,
        size: 5,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
      },
    };
  };

  const fixture = await mountDeckDetail(
    loadDeckDetailHook({ fetchDeckDetail, fetchDeckWords }),
    "deck-123"
  );

  try {
    const current = fixture.current();
    assert.equal(deckFetched, true);
    assert.equal(wordsFetched, true);
    assert.equal(current.isLoading, false);
    assert.equal(current.error, null);
    assert.equal(current.data?.deck.title, "Chủ đề Kinh doanh & Đàm phán");
    assert.equal(current.data?.deck.level, "B2");
    assert.equal(current.data?.deck.cardCount, 20);
    assert.equal(current.data?.totalCards, 20);
    assert.equal(current.data?.previewCards.length, 1);
    assert.equal(current.data?.previewCards[0].lemma, "collaborate");
  } finally {
    await fixture.close();
  }
});

test("useDeckDetail hook surfaces error when fetchDeckDetail fails", async () => {
  const fetchDeckDetail = async () => ({
    success: false,
    error: { message: "Không tìm thấy bộ từ vựng." },
  });
  const fetchDeckWords = async () => ({
    success: true,
    data: { items: [], page: 0, size: 5, totalItems: 0, totalPages: 0, hasNext: false },
  });

  const fixture = await mountDeckDetail(
    loadDeckDetailHook({ fetchDeckDetail, fetchDeckWords }),
    "deck-error-id"
  );

  try {
    const current = fixture.current();
    assert.equal(current.isLoading, false);
    assert.equal(current.error, "Không tìm thấy bộ từ vựng.");
    assert.equal(current.data, null);
  } finally {
    await fixture.close();
  }
});

test("useDeckDetail handles empty preview cards gracefully", async () => {
  const fetchDeckDetail = async () => ({
    success: true,
    data: { ...mockDeckDetail, cardCount: 0 },
  });
  const fetchDeckWords = async () => ({
    success: true,
    data: { items: [], page: 0, size: 5, totalItems: 0, totalPages: 0, hasNext: false },
  });

  const fixture = await mountDeckDetail(
    loadDeckDetailHook({ fetchDeckDetail, fetchDeckWords }),
    "deck-empty"
  );

  try {
    const current = fixture.current();
    assert.equal(current.isLoading, false);
    assert.equal(current.error, null);
    assert.equal(current.data?.previewCards.length, 0);
    assert.equal(current.data?.totalCards, 0);
  } finally {
    await fixture.close();
  }
});

test("useDeckDetail reload triggers re-fetching", async () => {
  let callCount = 0;
  const fetchDeckDetail = async () => {
    callCount++;
    return { success: true, data: mockDeckDetail };
  };
  const fetchDeckWords = async () => ({
    success: true,
    data: { items: mockPreviewCards, page: 0, size: 5, totalItems: 1, totalPages: 1, hasNext: false },
  });

  const fixture = await mountDeckDetail(
    loadDeckDetailHook({ fetchDeckDetail, fetchDeckWords }),
    "deck-123"
  );

  try {
    assert.equal(callCount, 1);
    await act(async () => {
      fixture.current().reload();
    });
    assert.equal(callCount, 2);
  } finally {
    await fixture.close();
  }
});

test("useDeckDetail drops outdated response if deckId changes", async () => {
  const slow = deferred();
  let requested = [];

  const fetchDeckDetail = async (id) => {
    requested.push(id);
    if (id === "old-deck") return slow.promise;
    return { success: true, data: { ...mockDeckDetail, id: "new-deck", title: "New Deck" } };
  };
  const fetchDeckWords = async () => ({
    success: true,
    data: { items: [], page: 0, size: 5, totalItems: 0, totalPages: 0, hasNext: false },
  });

  const fixture = await mountDeckDetail(
    loadDeckDetailHook({ fetchDeckDetail, fetchDeckWords }),
    "old-deck"
  );

  try {
    await fixture.update("new-deck");
    assert.equal(fixture.current().data?.deck.title, "New Deck");

    await act(async () => {
      slow.resolve({ success: true, data: { ...mockDeckDetail, id: "old-deck", title: "Old Deck" } });
    });

    assert.equal(fixture.current().data?.deck.title, "New Deck", "Old response must be dropped");
  } finally {
    await fixture.close();
  }
});
