import { expect, test } from "@playwright/test";
import { learner, mockSession } from "./helpers";

test("đổi mục tiêu bằng hộp thoại: gửi đúng dữ liệu, thẻ cập nhật và focus quay về nút mở", async ({ page }) => {
  await mockSession(page, learner);
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { headerName: "X-XSRF-TOKEN", token: "test-token" } })
  );
  let saved: unknown = null;
  await page.route("**/api/v1/users/me/goal", (route) => {
    if (route.request().method() === "PUT") {
      saved = route.request().postDataJSON();
      return route.fulfill({ json: { ...(saved as object) } });
    }
    return route.fulfill({ json: { targetScore: 750, dailyMinutes: 45, targetDate: null } });
  });

  await page.goto("/learn");
  const open = page.getByRole("button", { name: "Chỉnh sửa mục tiêu học tập" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Điểm TOEIC mục tiêu:").fill("800");
  await dialog.getByRole("button", { name: "Lưu mục tiêu" }).click();

  await expect(dialog).toBeHidden();
  expect(saved).toMatchObject({ targetScore: 800, dailyMinutes: 45 });
  await expect(page.getByText("800")).toBeVisible();
  await expect(open).toBeFocused();
});

test("hộp thoại mục tiêu: Esc đóng khi không đang lưu và không gửi gì", async ({ page }) => {
  await mockSession(page, learner);
  let puts = 0;
  await page.route("**/api/v1/users/me/goal", (route) => {
    if (route.request().method() === "PUT") puts += 1;
    return route.fulfill({ json: { targetScore: 750, dailyMinutes: 45, targetDate: null } });
  });
  await page.goto("/learn");
  await page.getByRole("button", { name: "Chỉnh sửa mục tiêu học tập" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(puts).toBe(0);
});

test("lỗi tải mục tiêu: không hiện form trống cho người học lưu nhầm, có nút tải lại", async ({ page }) => {
  await mockSession(page, learner);
  let failing = true;
  await page.route("**/api/v1/users/me/goal", (route) =>
    failing
      ? route.fulfill({ status: 500, json: { title: "Lỗi" } })
      : route.fulfill({ json: { targetScore: 750, dailyMinutes: 45, targetDate: null } })
  );
  await page.goto("/learn");
  await expect(page.getByText("Chưa đặt mục tiêu")).toHaveCount(0);
  const goal = page.locator(".goal-card");
  const retry = goal.getByRole("button", { name: "Thử lại", exact: true });
  await expect(retry).toBeVisible();
  failing = false;
  await retry.click();
  await expect(goal.locator(".goal-score")).toContainText("750");
});
