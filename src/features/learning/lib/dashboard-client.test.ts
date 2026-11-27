import test from "node:test";
import assert from "node:assert/strict";
import { fetchDashboard, isDashboard } from "./dashboard-client.ts";

export const dashboard = {
  overview: { todayLocal: "2026-11-28", timezone: "Asia/Ho_Chi_Minh", streakDays: 2, activeToday: true, totalActivityDays: 4 },
  vocabularyProgress: { studiedSenses: 4, masteredSenses: 1, dueNow: 2, savedSenses: 5, totalReviews: 9, reviewsLast7Days: 3 },
  todayReview: { dueNow: 2, savedSenses: 5, dueDecks: [] },
  studyPlan: {
    studyGoal: { configured: true, plannedDailyMinutes: 30, updatedAt: null },
    toeicTarget: { configured: true, currentScore: null, targetScore: 750, targetDate: null, status: "TARGET_ONLY_BASELINE_UNAVAILABLE" },
    studySchedule: { available: false, status: "UNAVAILABLE_PENDING_MIGRATION", supportedModes: [], activeMode: null, pendingProposalCount: 0 },
    studySession: { trackingAvailable: true, todayActualMinutes: 5, plannedDailyMinutes: 30, dailyGoalCompleted: false, status: "READY", streakDays: 2, activeToday: true },
  },
  practiceStatistics: { completedGrammarLessons: 1, inProgressGrammarLessons: 1, totalVisibleGrammarLessons: 3, submittedPracticeAttempts: 2, inProgressPracticeAttempts: 0, averagePracticeScorePercent: 60, toeicPracticeAvailable: false, recentAttempts: [] },
  weaknessAnalysis: { status: "INSUFFICIENT_DATA", minimumSampleSize: 20, periodDays: 30, weaknessThresholdPercent: 70, gradedQuestionsInPeriod: 5, weakTopics: [] },
  recommendations: [{ title: "Ôn tập", description: "Có thẻ đến hạn", targetUrl: "/learn/review", type: "FLASHCARD_REVIEW", skill: "VOCABULARY", reasonCode: "DUE_FLASHCARDS", priority: 1 }],
  notificationSummary: { unreadCount: 1, available: true, status: "READY" },
};

test("dashboard keeps actual study time separate from target and unavailable schedule", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(dashboard);
  try {
    const result = await fetchDashboard();
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.data.studyPlan.studySession.todayActualMinutes, 5);
      assert.equal(result.data.studyPlan.studySchedule.available, false);
      assert.equal(result.data.studyPlan.toeicTarget.currentScore, null);
    }
  } finally { globalThis.fetch = original; }
});

test("dashboard rejects malformed nested data and numeric strings", () => {
  assert.equal(isDashboard({}), false);
  assert.equal(isDashboard({ ...dashboard, recommendations: [null] }), false);
  assert.equal(isDashboard({ ...dashboard, vocabularyProgress: { ...dashboard.vocabularyProgress, dueNow: "2" } }), false);
});
