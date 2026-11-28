import { expect, test } from "@playwright/test";
import { admin, learner, mockSession, overflow, viewports } from "./helpers";

for (const path of ["/login", "/register", "/forgot-password"]) {
  for (const { width, height } of viewports) {
    test(`${path} ở ${width}px: có tiêu đề, không tràn ngang, không lỗi script`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await mockSession(page, null);
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await overflow(page), "nội dung rộng hơn khung nhìn").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
}

for (const { width, height } of viewports) {
  test(`khu học tập ở ${width}px: tổng quan, TOEIC và ngữ pháp không tràn ngang`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mockSession(page, learner);
    await page.setViewportSize({ width, height });
    for (const path of ["/learn", "/learn/toeic", "/learn/grammar"]) {
      await page.goto(path);
      await expect(page.getByRole("status").filter({ hasText: "Đang kiểm tra phiên đăng nhập..." })).toBeHidden({ timeout: 15_000 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await overflow(page), `${path} tràn ngang`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });
}

test("trang tổng quan chào đúng tên và có thẻ mục tiêu", async ({ page }) => {
  await mockSession(page, learner);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chào An");
  await expect(page.locator(".goal-card .goal-score")).toContainText("750");
});

test("menu tài khoản: mở bằng bàn phím, Esc đóng và trả focus về nút", async ({ page }) => {
  await mockSession(page, learner);
  await page.goto("/learn");
  const trigger = page.getByRole("button", { name: /Tài khoản của/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Tài khoản của tôi" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Tài khoản của tôi" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("người học vào /admin thấy màn 403, không thấy giao diện quản trị", async ({ page }) => {
  await mockSession(page, learner);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quản trị viên");
  await expect(page.getByText("403 / TRUY CẬP GIỚI HẠN")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Điều hướng quản trị" })).toHaveCount(0);
});

test("quản trị viên hệ thống thấy đủ bốn mục điều hướng", async ({ page }) => {
  await mockSession(page, admin);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  const nav = page.getByRole("complementary", { name: "Điều hướng quản trị" });
  for (const label of ["Tổng quan", "Người dùng & Quyền", "Quản trị nội dung", "Chính sách & Nhật ký"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

for (const { width, height } of viewports) {
  test(`quản trị ở ${width}px: tổng quan, người dùng và nội dung không tràn ngang`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mockSession(page, admin);
    await page.route("**/api/v1/admin/users**", (route) =>
      route.fulfill({
        json: {
          items: [{ id: "x1", displayName: "Người dùng một", email: "mot@example.com", roles: ["LEARNER"], status: "ACTIVE", activeSessionsCount: 1, lastLoginAt: null }],
          page: 0, size: 10, totalItems: 1, totalPages: 1, hasNext: false,
        },
      })
    );
    await page.route("**/api/v1/admin/content**", (route) =>
      route.fulfill({ json: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, hasNext: false } })
    );
    await page.setViewportSize({ width, height });
    for (const path of ["/admin", "/admin/users", "/admin/content"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await overflow(page), `${path} tràn ngang`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });
}

test("đăng nhập: thanh chuyển tab và liên kết đăng ký giữ tham số redirect", async ({ page }) => {
  await mockSession(page, null);
  await page.goto("/login?redirect=%2Flearn%2Fvocabulary");
  await expect(page.getByRole("link", { name: "Tạo tài khoản" })).toHaveAttribute(
    "href",
    "/register?redirect=%2Flearn%2Fvocabulary"
  );
});

test.describe("khi người dùng bật giảm chuyển động", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of ["/login", "/learn"]) {
    test(`${path} không còn hoạt ảnh lặp vô hạn đang chạy`, async ({ page }) => {
      await mockSession(page, path === "/learn" ? learner : null);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity)
          .map((a) => (a as CSSAnimation).animationName || a.id || "(không tên)")
      );
      expect(running, "hoạt ảnh vẫn chạy dù đã bật giảm chuyển động").toEqual([]);
    });
  }
});
