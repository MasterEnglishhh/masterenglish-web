import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  formatGoalDate,
  parseIsoDate,
  toLocalIsoDate,
  validateGoalInput,
} from "./goal-validation.ts";

const today = "2026-11-18";
const valid = { targetScore: 750, dailyMinutes: 45, targetDate: "" };

test("accepts the boundaries of the contract and omits an empty date", () => {
  for (const targetScore of [10, 990]) {
    const result = validateGoalInput({ ...valid, targetScore }, today);
    assert.equal(result.ok, true);
  }
  for (const dailyMinutes of [5, 240]) {
    const result = validateGoalInput({ ...valid, dailyMinutes }, today);
    assert.equal(result.ok, true);
  }
  const result = validateGoalInput(valid, today);
  assert.deepEqual(result.ok && result.value, {
    targetScore: 750,
    dailyMinutes: 45,
    targetDate: null,
  });
});

test("rejects scores outside 10-990 or not divisible by 5", () => {
  for (const targetScore of [0, 5, 995, 1000, Number.NaN, 650.5]) {
    const result = validateGoalInput({ ...valid, targetScore }, today);
    assert.equal(result.ok, false, `score ${targetScore}`);
    assert.ok(!result.ok && result.errors.targetScore);
  }
  const notStep = validateGoalInput({ ...valid, targetScore: 652 }, today);
  assert.ok(
    !notStep.ok && /chia hết cho 5/.test(notStep.errors.targetScore ?? "")
  );
});

test("rejects daily minutes outside 5-240 or not whole numbers", () => {
  for (const dailyMinutes of [0, 4, 241, Number.NaN, 5.5]) {
    const result = validateGoalInput({ ...valid, dailyMinutes }, today);
    assert.equal(result.ok, false, `minutes ${dailyMinutes}`);
    assert.ok(!result.ok && result.errors.dailyMinutes);
  }
});

test("target date must be a real calendar date that is today or later", () => {
  assert.equal(
    validateGoalInput({ ...valid, targetDate: today }, today).ok,
    true
  );
  assert.equal(
    validateGoalInput({ ...valid, targetDate: "2027-06-30" }, today).ok,
    true
  );

  const past = validateGoalInput({ ...valid, targetDate: "2026-11-17" }, today);
  assert.ok(!past.ok && /từ hôm nay trở đi/.test(past.errors.targetDate ?? ""));

  for (const targetDate of [
    "2027-02-30",
    "2027-13-01",
    "30/06/2027",
    "tomorrow",
  ]) {
    const result = validateGoalInput({ ...valid, targetDate }, today);
    assert.ok(!result.ok && result.errors.targetDate, targetDate);
  }
});

test("reports every invalid field at once", () => {
  const result = validateGoalInput(
    { targetScore: 7, dailyMinutes: 1, targetDate: "2020-01-01" },
    today
  );
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "dailyMinutes",
    "targetDate",
    "targetScore",
  ]);
});

test("parseIsoDate rejects impossible dates but accepts leap days", () => {
  assert.equal(parseIsoDate("2027-02-29"), null);
  assert.deepEqual(parseIsoDate("2028-02-29"), {
    year: 2028,
    month: 2,
    day: 29,
  });
});

test("today is taken from local time, not the UTC date", () => {
  // 00:30 sáng ngày 1/1: toISOString() sẽ trả 31/12 ở múi giờ UTC+7.
  assert.equal(toLocalIsoDate(new Date(2026, 0, 1, 0, 30)), "2026-01-01");
  assert.equal(toLocalIsoDate(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});

test("daysUntil counts calendar days regardless of the time of day", () => {
  const lateEvening = new Date(2026, 10, 18, 23, 45);
  const earlyMorning = new Date(2026, 10, 18, 0, 5);
  for (const now of [lateEvening, earlyMorning]) {
    assert.equal(daysUntil("2026-11-18", now), 0);
    assert.equal(daysUntil("2026-11-19", now), 1);
    assert.equal(daysUntil("2027-06-30", now), 224);
    assert.equal(daysUntil("2026-11-17", now), -1);
  }
});

test("daysUntil handles month, year and leap-year boundaries", () => {
  assert.equal(daysUntil("2027-01-01", new Date(2026, 11, 31, 12)), 1);
  assert.equal(daysUntil("2028-03-01", new Date(2028, 1, 28, 12)), 2);
  assert.equal(daysUntil("2027-03-01", new Date(2027, 1, 28, 12)), 1);
  assert.equal(daysUntil("not-a-date"), null);
});

test("formatGoalDate keeps the chosen calendar day", () => {
  assert.equal(formatGoalDate("2027-06-30"), "30/6/2027");
  assert.equal(formatGoalDate("2027-01-01"), "1/1/2027");
  assert.equal(formatGoalDate("bad"), "bad");
});
