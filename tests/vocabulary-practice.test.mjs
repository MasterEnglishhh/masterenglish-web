import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const card = {
  wordSenseId: "sense-1",
  wordId: "word-1",
  wordRevisionId: "revision-1",
  deckId: "deck-1",
  deckRevisionId: "deck-revision-1",
  position: 1,
  lemma: "fixture",
  partOfSpeech: "NOUN",
  cefrLevel: "B1",
  meaningVi: "fixture",
  examples: [],
  progress: null,
};
const success = {
  success: true,
  data: {
    reviewId: "review-1",
    wordSenseId: "sense-1",
    rating: "GOOD",
    repetitions: 1,
    intervalDays: 1,
    easeFactor: 2.6,
    nextDueAt: "2026-11-06T01:00:00Z",
    progressVersion: 0,
  },
};

function loadHook(submitReview) {
  const source = fs.readFileSync(
    new URL(
      "../src/features/vocabulary/hooks/use-vocabulary-practice.ts",
      import.meta.url
    ),
    "utf8"
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const hookModule = { exports: {} };
  const mocks = {
    submitReview,
    saveWordSense: async () => ({ success: true }),
    unsaveWordSense: async () => ({ success: true }),
  };
  const localRequire = (name) => (name === "react" ? React : mocks);
  new Function("require", "module", "exports", compiled)(
    localRequire,
    hookModule,
    hookModule.exports
  );
  return hookModule.exports.useVocabularyPractice;
}

async function mount(cards, submitReview) {
  const hook = loadHook(submitReview);
  let current;
  function Harness({ cards }) {
    current = hook({ cards });
    return React.createElement(
      "span",
      null,
      current.currentCard?.wordSenseId ?? "EMPTY"
    );
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness, { cards }));
  });
  return {
    current: () => current,
    update: async (cards) =>
      act(async () => {
        renderer.update(React.createElement(Harness, { cards }));
      }),
    close: async () => act(async () => renderer.unmount()),
  };
}

test("selecting a deck after an initially empty list must display its fetched card", async () => {
  const fixture = await mount([], async () => success);
  try {
    await fixture.update([card]);
    assert.equal(
      fixture.current().currentCard?.wordSenseId,
      card.wordSenseId,
      "the hook must consume cards arriving after mount"
    );
  } finally {
    await fixture.close();
  }
});

test("restarting must not submit the original null progress after a confirmed review", async () => {
  const requests = [];
  const fixture = await mount([card], async (body) => {
    requests.push(body);
    return success;
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    await act(async () => fixture.current().restart());
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    if (requests.length > 1) {
      assert.equal(
        requests[1].expectedProgressVersion,
        0,
        "the confirmed version must replace the original never-studied state"
      );
    }
  } finally {
    await fixture.close();
  }
});

test("an uncertain network result must not reuse the key with a different rating", async () => {
  const requests = [];
  const fixture = await mount([card], async (body) => {
    requests.push(body);
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "response lost", status: 0 },
    };
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    await act(async () => fixture.current().rate("HARD"));
    if (requests.length > 1) {
      assert.deepEqual(
        requests[1],
        requests[0],
        "until the first outcome is reconciled, retry must preserve the entire payload and key"
      );
    }
  } finally {
    await fixture.close();
  }
});

test("restarting is a preview and cannot create another review before due", async () => {
  const requests = [];
  const fixture = await mount([card], async (body) => {
    requests.push(body);
    return success;
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    await act(async () => fixture.current().restart());
    assert.equal(fixture.current().previewOnly, true);
    assert.equal(fixture.current().currentCard.progress.version, 0);
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("HARD"));
    assert.equal(requests.length, 1);
    assert.equal(fixture.current().summary.totalReviewed, 0);
    await act(async () => fixture.current().nextPreview());
    assert.equal(fixture.current().isFinished, true);
  } finally {
    await fixture.close();
  }
});
test("definitive conflict requires reloading rather than retrying a stale card", async () => {
  let count = 0;
  const fixture = await mount([card], async () => {
    count++;
    return {
      success: false,
      error: { status: 409, message: "stale", code: "CONFLICT" },
    };
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    await act(async () => fixture.current().retry());
    await act(async () => fixture.current().rate("HARD"));
    assert.equal(count, 1);
    assert.equal(fixture.current().requiresReload, true);
    assert.equal(fixture.current().summary.totalReviewed, 0);
  } finally {
    await fixture.close();
  }
});
test("two rapid submissions are serialized and count one confirmed result", async () => {
  let resolve;
  let count = 0;
  const fixture = await mount([card], () => {
    count++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => {
      const one = fixture.current().rate("GOOD");
      const two = fixture.current().rate("HARD");
      resolve(success);
      await Promise.all([one, two]);
    });
    assert.equal(count, 1);
    assert.equal(fixture.current().summary.totalReviewed, 1);
  } finally {
    await fixture.close();
  }
});

test("retry preserves the confirmed rating even after the user flips back to the front", async () => {
  const requests = [];
  const fixture = await mount([card], async (body) => {
    requests.push(body);
    return requests.length === 1
      ? {
          success: false,
          error: { status: 0, code: "NETWORK_ERROR", message: "lost" },
        }
      : success;
  });
  try {
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().rate("GOOD"));
    await act(async () => fixture.current().flip());
    await act(async () => fixture.current().retry());
    assert.deepEqual(requests[1], requests[0]);
    assert.equal(fixture.current().summary.totalReviewed, 1);
  } finally {
    await fixture.close();
  }
});
