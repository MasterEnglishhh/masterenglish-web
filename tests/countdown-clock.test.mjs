import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const countdownClock = loadHook(
  "src/features/auth/hooks/use-countdown-clock.ts",
  "useCountdownClock"
);
const useClock = (p) => countdownClock(p.keepTicking, p.blockedUntil);

test("counts down to a future moment as time passes, never below zero", async () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: 1_000_000 });
  const fixture = await mountHook(useClock, { keepTicking: false, blockedUntil: 0 });
  try {
    const until = 1_000_000 + 3_000;
    await fixture.update({ keepTicking: false, blockedUntil: until });
    assert.equal(fixture.current().remaining(until), 3);
    await act(async () => mock.timers.tick(1000));
    assert.equal(fixture.current().remaining(until), 2);
    await act(async () => mock.timers.tick(5000));
    assert.equal(fixture.current().remaining(until), 0);
  } finally {
    await fixture.close();
    mock.timers.reset();
  }
});

test("syncNow makes a freshly set moment show its full length immediately", async () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: 2_000_000 });
  const fixture = await mountHook(useClock, { keepTicking: false, blockedUntil: 0 });
  try {
    await act(async () => mock.timers.tick(400)); // đồng hồ chưa chạy: `now` cũ
    let until = 0;
    await act(async () => { until = fixture.current().syncNow() + 30_000; });
    assert.equal(fixture.current().remaining(until), 30);
  } finally {
    await fixture.close();
    mock.timers.reset();
  }
});

test("it does not tick when nothing is pending, and ticks while keepTicking is on", async () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: 3_000_000 });
  const idle = await mountHook(useClock, { keepTicking: false, blockedUntil: 0 });
  try {
    const until = Date.now() + 10_000;
    await act(async () => mock.timers.tick(4000));
    assert.equal(idle.current().remaining(until), 10, "an idle clock stays frozen");
  } finally {
    await idle.close();
  }
  const running = await mountHook(useClock, { keepTicking: true, blockedUntil: 0 });
  try {
    const until = Date.now() + 10_000;
    await act(async () => mock.timers.tick(4000));
    assert.equal(running.current().remaining(until), 6, "a running clock advances");
  } finally {
    await running.close();
    mock.timers.reset();
  }
});
