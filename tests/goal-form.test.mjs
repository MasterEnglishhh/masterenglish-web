import { test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

// goal-validation là hàm thuần: nạp bản thật để hook kiểm tra bằng luật thật.
const validation = "src/features/learning/lib/goal-validation.ts";
const mocks = {
  validateGoalInput: loadHook(validation, "validateGoalInput"),
  toLocalIsoDate: loadHook(validation, "toLocalIsoDate"),
};
const loadGoalForm = () =>
  loadHook("src/features/learning/hooks/use-goal-form.ts", "useGoalForm", mocks);
const event = { preventDefault() {} };

function setup(goal, onSave) {
  return mountHook((p) => loadGoalForm()(p.goal, p.onSave), { goal, onSave });
}

test("starts from the saved goal, or from sensible defaults when there is none", async () => {
  const saved = await setup({ targetScore: 750, dailyMinutes: 45, targetDate: "2099-01-01" }, async () => true);
  const empty = await setup(null, async () => true);
  try {
    assert.deepEqual(
      [saved.current().targetScore, saved.current().dailyMinutes, saved.current().targetDate],
      [750, 45, "2099-01-01"]
    );
    assert.deepEqual(
      [empty.current().targetScore, empty.current().dailyMinutes, empty.current().targetDate],
      [650, 30, ""]
    );
  } finally {
    await saved.close();
    await empty.close();
  }
});

test("an invalid goal shows field errors and is not sent", async () => {
  let sent = 0;
  const fixture = await setup(null, async () => (sent++, true));
  try {
    await act(async () => fixture.current().setTargetScore(5)); // dưới mức tối thiểu
    await act(async () => fixture.current().submit(event));
    assert.ok(fixture.current().errors.targetScore, "the score gets an error message");
    assert.equal(sent, 0);
  } finally {
    await fixture.close();
  }
});

test("a valid goal is sent once and clears earlier errors", async () => {
  const sent = [];
  const fixture = await setup(null, async (input) => (sent.push(input), true));
  try {
    await act(async () => fixture.current().setTargetScore(5));
    await act(async () => fixture.current().submit(event));
    assert.ok(fixture.current().errors.targetScore);
    await act(async () => fixture.current().setTargetScore(800));
    await act(async () => fixture.current().submit(event));
    assert.deepEqual(fixture.current().errors, {});
    assert.equal(sent.length, 1);
    assert.equal(sent[0].targetScore, 800);
    assert.equal(sent[0].dailyMinutes, 30);
  } finally {
    await fixture.close();
  }
});
