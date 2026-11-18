import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 850, height: 1024 },
  { width: 600, height: 900 },
  { width: 360, height: 800 },
];

/** Đánh dấu đã xem màn mở đầu để nó không che ảnh chụp; trường hợp lần đầu có bài riêng. */
async function skipIntro(page: Page) {
  await page.addInitScript(() => localStorage.setItem("me_intro_seen", "1"));
}

for (const { width, height } of viewports) {
  test(`trang chủ ở ${width}px: hiển thị đủ, không tràn ngang, không lỗi script`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await skipIntro(page);
    await page.setViewportSize({ width, height });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Học có hướng. Tiến bộ có lý do.");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "nội dung rộng hơn khung nhìn").toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);

    // Ảnh để xem bằng mắt; thư mục test-results không được đưa vào Git.
    await page.screenshot({ path: `test-results/landing-${width}.png`, fullPage: true });
  });
}

test("lần đầu có màn mở đầu và bấm SKIP đóng được ngay", async ({ page }) => {
  await page.goto("/");
  const skip = page.getByRole("button", { name: /SKIP/ });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(skip).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: /SKIP/ })).toBeHidden();
});

test("thẻ từ mẫu: chỉ chấm được sau khi lật, phím 1/2/3 hoạt động", async ({ page }) => {
  await skipIntro(page);
  await page.goto("/");
  const demo = page.getByRole("group", { name: "Thẻ từ mẫu để thử ôn tập" }).first();
  const rate = demo.getByRole("button", { name: /Đã nhớ/ });
  await expect(rate).toBeDisabled();
  await demo.getByRole("button", { name: /Lật thẻ/ }).click();
  await expect(rate).toBeEnabled();
  await demo.getByRole("button", { name: /Xem lại mặt trước/ }).focus();
  await page.keyboard.press("3");
  await expect(demo.getByText("deadline").first()).toBeVisible();
});

test("nút chính: khách thấy Bắt đầu miễn phí → /register, đã đăng nhập thấy Vào không gian học → /learn", async ({
  page,
}) => {
  await skipIntro(page);
  await page.route("**/api/v1/users/me", (route) => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto("/");
  const hero = page.locator(".lp-hero").getByRole("link", { name: /Bắt đầu miễn phí/ });
  await expect(hero).toHaveAttribute("href", "/register");

  await page.unroute("**/api/v1/users/me");
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      json: {
        id: "u1", email: "hoc.vien@example.com", displayName: "Học viên mẫu", firstName: null,
        lastName: null, roles: ["LEARNER"], phone: null, avatarMediaId: null,
      },
    })
  );
  await page.reload();
  const loggedIn = page.locator(".lp-hero").getByRole("link", { name: /Vào không gian học/ });
  await expect(loggedIn).toHaveAttribute("href", "/learn");
});

test("mọi giao diện mô phỏng đều gắn nhãn Ví dụ minh họa", async ({ page }) => {
  await skipIntro(page);
  await page.goto("/");
  // 1 sân khấu hero + 1 thẻ lật + 4 khung tính năng (mỗi khung 1 nhãn, khung ôn tập có nhãn riêng của thẻ)
  expect(await page.getByText("Ví dụ minh họa").count()).toBeGreaterThanOrEqual(6);
});

test.describe("khi người dùng bật giảm chuyển động", () => {
  test.use({ reducedMotion: "reduce" });

  test("trang chủ không còn hoạt ảnh lặp vô hạn đang chạy", async ({ page }) => {
    await skipIntro(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" && animation.effect?.getComputedTiming().iterations === Infinity
        )
        .map((animation) => animation.id || "(không tên)")
    );
    expect(running, "hoạt ảnh vẫn chạy dù đã bật giảm chuyển động").toEqual([]);
  });

  test("không hiện màn mở đầu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /SKIP/ })).toBeHidden();
  });
});
