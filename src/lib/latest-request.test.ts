import { test } from "node:test";
import assert from "node:assert/strict";
import { createLatestRequestTracker } from "./latest-request.ts";

test("only the most recent request is allowed to update state", () => {
  const tracker = createLatestRequestTracker();
  const first = tracker.begin();
  const second = tracker.begin();
  assert.equal(tracker.isCurrent(first), false);
  assert.equal(tracker.isCurrent(second), true);
});

test("a slow older response cannot overwrite a newer one", async () => {
  const tracker = createLatestRequestTracker();
  let shown = "";
  const run = async (label: string, delayMs: number) => {
    const ticket = tracker.begin();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (tracker.isCurrent(ticket)) shown = label;
  };
  // "cũ" được gửi trước nhưng phản hồi sau "mới".
  await Promise.all([run("cũ", 30), run("mới", 5)]);
  assert.equal(shown, "mới");
});

test("invalidate drops every in-flight request", () => {
  const tracker = createLatestRequestTracker();
  const ticket = tracker.begin();
  tracker.invalidate();
  assert.equal(tracker.isCurrent(ticket), false);
});
