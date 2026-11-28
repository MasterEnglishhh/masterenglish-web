import type { Page } from "@playwright/test";

export const viewports = [
  { width: 1440, height: 900 },
  { width: 850, height: 1024 },
  { width: 600, height: 900 },
  { width: 360, height: 800 },
];

export const learner = {
  id: "u1",
  email: "hoc.vien@example.com",
  displayName: "Nguyễn An",
  firstName: "An",
  lastName: "Nguyễn",
  roles: ["LEARNER"],
  phone: null,
  avatarMediaId: null,
};
export const admin = { ...learner, roles: ["SYSTEM_ADMIN"] };

/** Dựng phiên giả: `/me` trả người dùng, các API học tập trả dữ liệu rỗng hợp lệ. */
export async function mockSession(page: Page, user: typeof learner | null) {
  await page.addInitScript(() => localStorage.setItem("me_intro_seen", "1"));
  await page.route("**/api/v1/users/me", (route) =>
    user
      ? route.fulfill({ json: user })
      : route.fulfill({ status: 401, json: {} })
  );
  await page.route("**/api/v1/auth/refresh", (route) =>
    route.fulfill({ status: 401, json: {} })
  );
  await page.route("**/api/v1/users/me/goal", (route) =>
    route.fulfill({
      json: { targetScore: 750, dailyMinutes: 45, targetDate: null },
    })
  );
  await page.route("**/api/v1/admin/overview/**", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/v1/dashboard", (route) =>
    route.fulfill({ json: dashboard })
  );
  await page.route("**/api/v1/grammar/topics?**", (route) =>
    route.fulfill({
      json: {
        items: [],
        page: 0,
        size: 12,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
      },
    })
  );
}

export async function overflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
}

export const dashboard = {
  overview: {
    todayLocal: "2026-11-28",
    timezone: "Asia/Ho_Chi_Minh",
    streakDays: 0,
    activeToday: false,
    totalActivityDays: 0,
  },
  vocabularyProgress: {
    studiedSenses: 0,
    masteredSenses: 0,
    dueNow: 0,
    savedSenses: 0,
    totalReviews: 0,
    reviewsLast7Days: 0,
  },
  todayReview: { dueNow: 0, dueDecks: [] },
  studyPlan: {
    studyGoal: { configured: true, plannedDailyMinutes: 45 },
    toeicTarget: {
      configured: true,
      currentScore: null,
      targetScore: 750,
      targetDate: null,
      status: "TARGET_ONLY_BASELINE_UNAVAILABLE",
    },
    studySchedule: {
      available: false,
      status: "UNAVAILABLE_PENDING_MIGRATION",
    },
    studySession: {
      trackingAvailable: true,
      todayActualMinutes: 0,
      dailyGoalCompleted: false,
      status: "NO_DATA",
    },
  },
  practiceStatistics: {
    completedGrammarLessons: 0,
    submittedPracticeAttempts: 0,
    toeicPracticeAvailable: false,
    recentAttempts: [],
  },
  weaknessAnalysis: {
    status: "NO_DATA",
    periodDays: 30,
    minimumSampleSize: 20,
    weakTopics: [],
  },
  recommendations: [],
  notificationSummary: { unreadCount: 0, available: true, status: "READY" },
};
