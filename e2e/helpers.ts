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
    user ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: {} })
  );
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/v1/users/me/goal", (route) =>
    route.fulfill({ json: { targetScore: 750, dailyMinutes: 45, targetDate: null } })
  );
  await page.route("**/api/v1/admin/overview/**", (route) => route.fulfill({ json: [] }));
}

export async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}
