import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  fetchDecks,
  fetchDeckCards,
  saveWordSense,
  unsaveWordSense,
  fetchDueQueue,
  submitReview,
  fetchPronunciationTicket,
} from "./vocabulary-client.ts";
import type { ReviewRequest } from "../types/vocabulary.ts";

test("pronunciation ticket refreshes an expired session before issuing a playback URL", async () => {
  const originalFetch = globalThis.fetch;
  let tickets = 0;
  let refreshes = 0;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/users/me")) return new Response(null, { status: 401 });
    if (url.includes("/auth/csrf"))
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
        { status: 200 }
      );
    if (url.includes("/auth/refresh")) {
      refreshes++;
      return new Response(null, { status: 204 });
    }
    if (url.endsWith("/ticket")) {
      tickets++;
      if (tickets === 1) return new Response(null, { status: 401 });
      return new Response(
        JSON.stringify({
          url: "https://media.example.com/word.mp3?signature=test",
        }),
        { status: 200 }
      );
    }
    return new Response(null, { status: 404 });
  });
  try {
    const result = await fetchPronunciationTicket(
      "/api/v1/vocabulary/pronunciations/10000000-0000-0000-0000-000000000001"
    );
    assert.equal(result.success, true);
    assert.equal(tickets, 2);
    assert.equal(refreshes, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("pronunciation requests never send authentication to an external URL", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = mock.fn(async () => {
    calls++;
    return new Response(null, { status: 200 });
  });
  try {
    const result = await fetchPronunciationTicket(
      "https://other.example/steal-session"
    );
    assert.equal(result.success, false);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client fetchDecks succeeds and returns page", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/vocabulary/decks")) {
      return new Response(
        JSON.stringify({
          items: [
            {
              id: "d1000000-0000-0000-0000-000000000001",
              title: "Workplace & Daily Communication",
              description: "Desc",
              level: "B1",
              cardCount: 12,
              createdAt: "2026-11-05T00:00:00Z",
            },
          ],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, { status: 404 });
  });

  try {
    const res = await fetchDecks();
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.items.length, 1);
      assert.equal(res.data.items[0].title, "Workplace & Daily Communication");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client fetchDeckCards returns deck cards", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/vocabulary/decks/deck-1/words")) {
      return new Response(
        JSON.stringify({
          items: [
            {
              deckId: "deck-1",
              deckRevisionId: "drev-1",
              position: 1,
              wordSenseId: "sense-1",
              wordId: "word-1",
              wordRevisionId: "wrev-1",
              lemma: "approach",
              ipa: "/əˈprəʊtʃ/",
              partOfSpeech: "NOUN",
              cefrLevel: "B1",
              meaningVi: "cách tiếp cận",
              definitionEn: "a way of dealing with somebody/something",
              examples: [],
              audioUrl: null,
              isSaved: false,
              progress: null,
            },
          ],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, { status: 404 });
  });

  try {
    const res = await fetchDeckCards("deck-1");
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.items.length, 1);
      assert.equal(res.data.items[0].lemma, "approach");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client saveWordSense and unsaveWordSense send CSRF", async () => {
  const originalFetch = globalThis.fetch;
  let savedSense = false;
  let unsavedSense = false;

  globalThis.fetch = mock.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/v1/auth/csrf")) {
        return new Response(
          JSON.stringify({
            headerName: "X-XSRF-TOKEN",
            token: "csrf-token-123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/v1/vocabulary/saved-words/sense-1")) {
        if (init?.method === "PUT") {
          savedSense = true;
          return new Response(null, { status: 204 });
        }
        if (init?.method === "DELETE") {
          unsavedSense = true;
          return new Response(null, { status: 204 });
        }
      }
      return new Response(null, { status: 404 });
    }
  );

  try {
    const saveRes = await saveWordSense("sense-1");
    assert.equal(saveRes.success, true);
    assert.equal(savedSense, true);

    const unsaveRes = await unsaveWordSense("sense-1");
    assert.equal(unsaveRes.success, true);
    assert.equal(unsavedSense, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client fetchDueQueue returns totalDue and cards", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/vocabulary/reviews/due")) {
      return new Response(
        JSON.stringify({
          totalDue: 2,
          cards: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, { status: 404 });
  });

  try {
    const res = await fetchDueQueue();
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.totalDue, 2);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client submitReview sends CSRF and body", async () => {
  const originalFetch = globalThis.fetch;
  let sentBody: string | null = null;
  let sentCsrf: string | null = null;

  globalThis.fetch = mock.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/v1/auth/csrf")) {
        return new Response(
          JSON.stringify({
            headerName: "X-XSRF-TOKEN",
            token: "csrf-token-123",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/v1/vocabulary/reviews")) {
        sentBody = String(init?.body);
        sentCsrf =
          (init?.headers as Record<string, string>)?.["X-XSRF-TOKEN"] ?? null;
        return new Response(
          JSON.stringify({
            reviewId: "r1000000-0000-0000-0000-000000000001",
            wordSenseId: "20000000-0000-0000-0000-000000000001",
            rating: "GOOD",
            intervalDays: 1,
            easeFactor: 2.6,
            repetitions: 1,
            nextDueAt: "2026-11-06T10:00:00Z",
            progressVersion: 1,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 404 });
    }
  );

  try {
    const payload: ReviewRequest = {
      wordSenseId: "20000000-0000-0000-0000-000000000001",
      sourceWordId: "10000000-0000-0000-0000-000000000001",
      sourceRevisionId: "rev-1",
      deckId: "d1000000-0000-0000-0000-000000000001",
      deckRevisionId: "drev-1",
      rating: "GOOD",
      reviewRequestId: "req-1",
      expectedProgressVersion: null,
    };

    const res = await submitReview(payload);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.rating, "GOOD");
      assert.equal(res.data.repetitions, 1);
    }
    assert.ok(sentBody?.includes('"rating":"GOOD"'));
    assert.equal(sentCsrf, "csrf-token-123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vocabulary client handles 403 Forbidden without refresh loop", async () => {
  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;

  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/auth/refresh")) {
      refreshCalls++;
      return new Response(null, { status: 200 });
    }
    if (url.includes("/api/v1/vocabulary/decks")) {
      return new Response(
        JSON.stringify({
          type: "about:blank",
          title: "Forbidden",
          status: 403,
          code: "ACCESS_DENIED",
          detail: "Access denied.",
        }),
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    return new Response(null, { status: 404 });
  });

  try {
    const res = await fetchDecks();
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.error.status, 403);
    }
    assert.equal(refreshCalls, 0, "403 must not trigger refresh loop");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("review conflict gives a user action without exposing technical versions", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/auth/csrf"))
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-test" }),
        { status: 200 }
      );
    return new Response(
      JSON.stringify({
        code: "CONFLICT",
        detail: "Stale progress version: expected 4 but current version is 5",
      }),
      { status: 409 }
    );
  });
  try {
    const result = await submitReview({
      wordSenseId: "sense",
      sourceWordId: "word",
      sourceRevisionId: "revision",
      rating: "GOOD",
      reviewRequestId: "request",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.status, 409);
      assert.ok(!result.error.message.includes("version"));
      assert.ok(result.error.message.includes("Tải lại"));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("refresh service failure remains a network/service problem rather than an expired account", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/auth/csrf"))
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-test" }),
        { status: 200 }
      );
    if (url.includes("/auth/refresh"))
      return new Response(null, { status: 503 });
    return new Response(null, { status: 401 });
  });
  try {
    const result = await fetchDecks();
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.code, "NETWORK_ERROR");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
