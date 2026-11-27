import { requestJson } from "../../../lib/http.ts";
import { isRecord } from "../../../lib/api-validation.ts";

interface StudyPlan {
  studyGoal: { configured: boolean; plannedDailyMinutes: number | null };
  toeicTarget: { configured: boolean; targetScore: number | null; currentScore: number | null; targetDate: string | null; status: string };
  studySchedule: { available: boolean; status: string };
  studySession: { trackingAvailable: boolean; todayActualMinutes: number | null; dailyGoalCompleted: boolean | null; status: string };
}
export interface Dashboard {
  overview: { todayLocal: string; timezone: string; streakDays: number; activeToday: boolean; totalActivityDays: number };
  vocabularyProgress: { studiedSenses: number; masteredSenses: number; dueNow: number; savedSenses: number; totalReviews: number; reviewsLast7Days: number };
  todayReview: { dueNow: number; dueDecks: { deckId: string; title: string; dueCount: number }[] };
  studyPlan: StudyPlan;
  practiceStatistics: { completedGrammarLessons: number; submittedPracticeAttempts: number; toeicPracticeAvailable: boolean; recentAttempts: { attemptId: string; sourceType: string; totalCount: number; correctCount: number | null; score: number | null; submittedAt: string }[] };
  weaknessAnalysis: { status: string; minimumSampleSize: number; periodDays: number; weakTopics: { topicId: string; topicName: string; accuracyPercent: number }[] };
  recommendations: { type: string; title: string; description: string; targetUrl: string }[];
  notificationSummary: { unreadCount: number; available: boolean; status: string };
}

const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const nullableNumber = (v: unknown) => v === null || number(v);

export function isDashboard(v: unknown): v is Dashboard {
  if (!isRecord(v) || !isRecord(v.overview) || !isRecord(v.vocabularyProgress) || !isRecord(v.todayReview)
    || !isRecord(v.studyPlan) || !isRecord(v.practiceStatistics) || !isRecord(v.weaknessAnalysis) || !isRecord(v.notificationSummary)) return false;
  const plan = v.studyPlan;
  return typeof v.overview.todayLocal === "string" && typeof v.overview.timezone === "string"
    && number(v.overview.streakDays) && typeof v.overview.activeToday === "boolean" && number(v.overview.totalActivityDays)
    && ["studiedSenses", "masteredSenses", "dueNow", "savedSenses", "totalReviews", "reviewsLast7Days"].every(key => number((v.vocabularyProgress as Record<string, unknown>)[key]))
    && number(v.todayReview.dueNow) && Array.isArray(v.todayReview.dueDecks)
    && v.todayReview.dueDecks.every(d => isRecord(d) && typeof d.deckId === "string" && typeof d.title === "string" && number(d.dueCount))
    && isRecord(plan.studyGoal) && typeof plan.studyGoal.configured === "boolean" && nullableNumber(plan.studyGoal.plannedDailyMinutes)
    && isRecord(plan.toeicTarget) && typeof plan.toeicTarget.configured === "boolean" && nullableNumber(plan.toeicTarget.targetScore) && nullableNumber(plan.toeicTarget.currentScore)
    && (plan.toeicTarget.targetDate === null || typeof plan.toeicTarget.targetDate === "string") && typeof plan.toeicTarget.status === "string"
    && isRecord(plan.studySchedule) && typeof plan.studySchedule.available === "boolean" && typeof plan.studySchedule.status === "string"
    && isRecord(plan.studySession) && typeof plan.studySession.trackingAvailable === "boolean" && nullableNumber(plan.studySession.todayActualMinutes)
    && (plan.studySession.dailyGoalCompleted === null || typeof plan.studySession.dailyGoalCompleted === "boolean") && typeof plan.studySession.status === "string"
    && number(v.practiceStatistics.completedGrammarLessons) && number(v.practiceStatistics.submittedPracticeAttempts) && typeof v.practiceStatistics.toeicPracticeAvailable === "boolean"
    && Array.isArray(v.practiceStatistics.recentAttempts) && v.practiceStatistics.recentAttempts.every(a => isRecord(a) && typeof a.attemptId === "string" && typeof a.sourceType === "string" && number(a.totalCount) && nullableNumber(a.correctCount) && nullableNumber(a.score) && typeof a.submittedAt === "string")
    && typeof v.weaknessAnalysis.status === "string" && number(v.weaknessAnalysis.minimumSampleSize) && number(v.weaknessAnalysis.periodDays)
    && Array.isArray(v.weaknessAnalysis.weakTopics) && v.weaknessAnalysis.weakTopics.every(t => isRecord(t) && typeof t.topicId === "string" && typeof t.topicName === "string" && number(t.accuracyPercent))
    && Array.isArray(v.recommendations) && v.recommendations.every(r => isRecord(r) && [r.type, r.title, r.description, r.targetUrl].every(s => typeof s === "string"))
    && number(v.notificationSummary.unreadCount) && typeof v.notificationSummary.available === "boolean" && typeof v.notificationSummary.status === "string";
}

export function fetchDashboard(signal?: AbortSignal) {
  return requestJson<Dashboard>("/api/v1/dashboard", { signal, validate: isDashboard });
}
