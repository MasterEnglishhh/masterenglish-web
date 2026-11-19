import { expect, test } from "@playwright/test";
import { admin, learner, mockSession } from "./helpers";

const contentAdmin = { ...learner, roles: ["CONTENT_ADMIN"] };

test("trang từ vựng hiện khung học tập trong lúc chờ xác minh phiên", async ({ page }) => {
  await mockSession(page, learner);
  let releaseProfile!: () => void;
  const pendingProfile = new Promise<void>((resolve) => { releaseProfile = resolve; });
  await page.route("**/api/v1/users/me", async (route) => {
    await pendingProfile;
    await route.fulfill({ json: learner });
  });

  try {
    await page.goto("/learn/vocabulary");
    await expect(page.locator(".learning-topbar")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Đang kiểm tra phiên đăng nhập..." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  } finally {
    releaseProfile();
  }
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("giảng viên không thấy mục hệ thống hoặc gửi request vượt quyền", async ({ page }) => {
  await mockSession(page, contentAdmin);
  const restrictedRequests: string[] = [];
  await page.route(/\/api\/v1\/admin\/(users|system)([/?]|$)/, (route) => {
    restrictedRequests.push(route.request().url());
    return route.fulfill({ status: 403, json: {} });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/admin/users", "/admin/system"]) {
    await page.goto(path);
    await expect(page.getByText("403 / TRUY CẬP GIỚI HẠN")).toBeVisible();
  }
  const nav = page.getByRole("navigation", { name: "Điều hướng quản trị" });
  await expect(nav.getByRole("link", { name: "Quản trị nội dung" })).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(2);
  expect(restrictedRequests).toEqual([]);
});

for (const user of [contentAdmin, admin]) {
  test(`${user.roles[0]} vào cổng quản trị từ trang đăng nhập và khu học tập`, async ({ page }) => {
    await mockSession(page, user);
    await page.goto("/login");
    await expect(page).toHaveURL("/admin");
    await page.goto("/learn/vocabulary");
    await expect(page).toHaveURL("/admin");
  });
}

test("tài khoản có cả hai quyền vẫn vào được đích học tập được yêu cầu", async ({ page }) => {
  await mockSession(page, { ...admin, roles: ["SYSTEM_ADMIN", "LEARNER"] });
  await page.goto("/login?redirect=%2Flearn%2Fgrammar%3Fmode%3Dreview%23start");
  await expect(page).toHaveURL("/learn/grammar?mode=review#start");
  await expect(page.locator(".learning-shell")).toBeVisible();
});

test("giảng viên vẫn mở được trang hồ sơ từ liên kết cũ", async ({ page }) => {
  await mockSession(page, contentAdmin);
  await page.goto("/learn/account");
  await expect(page).toHaveURL("/admin/account");
  await expect(page.getByRole("heading", { name: "Tài khoản của tôi" })).toBeVisible();
});

for (const [user, destination] of [[learner, "/learn"], [admin, "/admin"]] as const) {
  test(`đăng nhập thành công với ${user.roles[0]} mở ${destination}`, async ({ page }) => {
    await mockSession(page, null);
    await page.route("**/api/v1/auth/csrf", (route) =>
      route.fulfill({ json: { headerName: "X-XSRF-TOKEN", token: "test-token" } })
    );
    await page.route("**/api/v1/auth/login", (route) => route.fulfill({ json: user }));
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("mot cum tu dai de nho");
    await page.getByRole("button", { name: /^Đăng nhập/ }).click();
    await expect(page).toHaveURL(destination);
  });
}
