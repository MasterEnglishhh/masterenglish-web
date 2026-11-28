import { expect, test } from "@playwright/test";
import { dashboard, learner, mockSession, overflow } from "./helpers";

for (const width of [360, 1440]) {
  test(`lưu mục tiêu cập nhật lại dashboard ở ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockSession(page, learner);
    let reads = 0;
    let score = 750;
    await page.route("**/api/v1/dashboard", (route) =>
      route.fulfill({
        json: {
          ...dashboard,
          studyPlan: {
            ...dashboard.studyPlan,
            toeicTarget: {
              ...dashboard.studyPlan.toeicTarget,
              targetScore: score,
            },
          },
        },
      })
    );
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/v1/dashboard") reads++;
    });
    await page.route("**/api/v1/auth/csrf", (route) =>
      route.fulfill({ json: { headerName: "X-XSRF-TOKEN", token: "test" } })
    );
    await page.route("**/api/v1/users/me/goal", (route) => {
      if (route.request().method() === "PUT")
        score = route.request().postDataJSON().targetScore;
      return route.fulfill({
        json: { targetScore: score, dailyMinutes: 45, targetDate: null },
      });
    });
    await page.goto("/learn");
    await expect(page.locator(".goal-score strong")).toContainText("750");
    await expect.poll(() => reads).toBe(1);
    await page
      .getByRole("button", { name: "Chỉnh sửa mục tiêu học tập", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Điểm TOEIC mục tiêu:").fill("800");
    await dialog
      .getByRole("button", { name: "Lưu mục tiêu", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".goal-score strong")).toContainText("800");
    await expect.poll(() => reads).toBe(2);
    await expect(
      page
        .locator(".study-card")
        .filter({
          has: page.getByRole("heading", {
            name: "Điểm TOEIC hướng tới",
            exact: true,
          }),
        })
        .locator(".study-number")
    ).toHaveText("800");
    await expect.poll(() => overflow(page)).toBeLessThanOrEqual(1);
  });
}

for (const role of ["LEARNER", "CONTENT_ADMIN", "SYSTEM_ADMIN"]) {
  test(`CTA trang chủ đúng khu vực của ${role}`, async ({ page }) => {
    await mockSession(page, { ...learner, roles: [role] });
    await page.goto("/");
    const isLearner = role === "LEARNER";
    await expect(
      page
        .getByRole("link", {
          name: isLearner ? "Vào không gian học" : "Vào khu quản trị",
          exact: true,
        })
        .first()
    ).toHaveAttribute("href", isLearner ? "/learn" : "/admin");
  });
}
