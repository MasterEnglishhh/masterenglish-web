import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { loadHook } from "./helpers/load-hook.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const savedGoal = {
  targetScore: 750,
  dailyMinutes: 45,
  targetDate: "2027-06-30",
  updatedAt: "2026-11-11T18:10:21Z",
};
const input = { targetScore: 750, dailyMinutes: 45, targetDate: "2027-06-30" };
const failure = (message, status = 500) => ({
  success: false,
  error: { message, status },
});

function loadGoal(mocks) {
  return loadHook(
    "src/features/learning/hooks/use-learning-goal.ts",
    "useLearningGoal",
    mocks
  );
}

async function mount(mocks) {
  const hook = loadGoal(mocks);
  let current;
  function Harness() {
    current = hook();
    return React.createElement(
      "span",
      null,
      current.goal ? "HAS_GOAL" : "NO_GOAL"
    );
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Harness));
  });
  return {
    current: () => current,
    close: async () => act(async () => renderer.unmount()),
  };
}

test("a failed load is an error with retry, never the 'no goal yet' empty state", async () => {
  let calls = 0;
  const fixture = await mount({
    fetchLearningGoal: async () =>
      ++calls === 1
        ? failure("Dịch vụ đang gián đoạn. Vui lòng thử lại sau.")
        : { success: true, data: savedGoal },
    updateLearningGoal: async () => ({ success: true, data: savedGoal }),
  });
  try {
    assert.equal(fixture.current().goal, null);
    assert.match(fixture.current().loadError, /gián đoạn/);
    assert.equal(fixture.current().isLoading, false);

    await act(async () => fixture.current().refreshGoal());
    assert.equal(fixture.current().loadError, null);
    assert.deepEqual(fixture.current().goal, savedGoal);
    assert.equal(calls, 2);
  } finally {
    await fixture.close();
  }
});

test("no goal yet (404 mapped to null) is an empty state, not an error", async () => {
  const fixture = await mount({
    fetchLearningGoal: async () => ({ success: true, data: null }),
    updateLearningGoal: async () => ({ success: true, data: savedGoal }),
  });
  try {
    assert.equal(fixture.current().goal, null);
    assert.equal(fixture.current().loadError, null);
    assert.equal(fixture.current().isLoading, false);
  } finally {
    await fixture.close();
  }
});

test("a rejected save keeps the dialog open and shows the server's reason", async () => {
  const fixture = await mount({
    fetchLearningGoal: async () => ({ success: true, data: null }),
    updateLearningGoal: async () =>
      failure("Ngày mục tiêu phải từ hôm nay trở đi.", 400),
  });
  try {
    await act(async () => fixture.current().openModal());
    let ok;
    await act(async () => {
      ok = await fixture.current().saveGoal(input);
    });
    assert.equal(ok, false);
    assert.equal(fixture.current().isModalOpen, true);
    assert.equal(
      fixture.current().saveError,
      "Ngày mục tiêu phải từ hôm nay trở đi."
    );
    assert.equal(fixture.current().goal, null);

    await act(async () => fixture.current().closeModal());
    assert.equal(fixture.current().saveError, null);
    assert.equal(fixture.current().isModalOpen, false);
  } finally {
    await fixture.close();
  }
});

test("a successful save stores the server's goal and closes the dialog", async () => {
  const sent = [];
  const fixture = await mount({
    fetchLearningGoal: async () => ({ success: true, data: null }),
    updateLearningGoal: async (body) => {
      sent.push(body);
      return { success: true, data: savedGoal };
    },
  });
  try {
    await act(async () => fixture.current().openModal());
    let ok;
    await act(async () => {
      ok = await fixture.current().saveGoal(input);
    });
    assert.equal(ok, true);
    assert.deepEqual(sent, [input]);
    assert.deepEqual(fixture.current().goal, savedGoal);
    assert.equal(fixture.current().isModalOpen, false);
    assert.equal(fixture.current().saveError, null);
  } finally {
    await fixture.close();
  }
});

test("a second submit while the first is in flight is ignored", async () => {
  let release;
  let sends = 0;
  const fixture = await mount({
    fetchLearningGoal: async () => ({ success: true, data: null }),
    updateLearningGoal: () => {
      sends += 1;
      return new Promise((resolve) => {
        release = () => resolve({ success: true, data: savedGoal });
      });
    },
  });
  try {
    let first;
    let second;
    await act(async () => {
      first = fixture.current().saveGoal(input);
      second = fixture.current().saveGoal(input);
      release();
      await Promise.all([first, second]);
    });
    assert.equal(sends, 1, "the goal must be sent once");
    assert.equal(await second, false);
    assert.equal(await first, true);
  } finally {
    await fixture.close();
  }
});
