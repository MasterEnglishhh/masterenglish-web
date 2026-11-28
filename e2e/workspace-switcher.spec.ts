import { expect, test, type Page } from "@playwright/test";
import { learner, mockSession, overflow } from "./helpers";

async function headerActions(page: Page, headerSelector: string, name: string) {
  const header = page.locator(headerSelector);
  const link = header.getByRole("link", { name, exact: true });
  const account = header.getByRole("button", { name: /Tài khoản của/ });
  await expect(link).toBeVisible();
  await page.mouse.move(0, 0);
  await expect
    .poll(async () => {
      const linkBox = (await link.boundingBox())!;
      const accountBox = (await account.boundingBox())!;
      return Math.abs(
        linkBox.y + linkBox.height / 2 - accountBox.y - accountBox.height / 2
      );
    })
    .toBeLessThanOrEqual(1);
  const box = (await link.boundingBox())!;
  const avatar = (await account.boundingBox())!;
  expect(Math.round(box.height * 100) / 100).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(avatar.x);
  expect(
    Math.abs(box.y + box.height / 2 - avatar.y - avatar.height / 2)
  ).toBeLessThanOrEqual(1);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  return { link, gap: avatar.x - box.x - box.width };
}

for (const role of ["SYSTEM_ADMIN", "CONTENT_ADMIN"]) {
  for (const width of [320, 360, 600, 850, 1440]) {
    test(`${role} ở ${width}px: chuyển hai chiều tại header, dùng bàn phím và giữ khu vực khi mở hồ sơ`, async ({
      page,
    }) => {
      await mockSession(page, { ...learner, roles: ["LEARNER", role] });
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/learn");
      const learning = await headerActions(
        page,
        ".learning-topbar",
        "Sang quản trị"
      );
      await learning.link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/admin$/);
      const admin = await headerActions(page, ".admin-topbar", "Về học tập");
      expect(Math.abs(admin.gap - learning.gap)).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: /Tài khoản của/ }).click();
      await expect(
        page
          .locator(".account-panel")
          .getByRole("link", { name: /Cổng quản trị|Về học tập|Sang quản trị/ })
      ).toHaveCount(0);
      await page
        .getByRole("link", { name: "Tài khoản của tôi", exact: true })
        .click();
      await expect(page).toHaveURL(/\/admin\/account$/);
      const back = await headerActions(page, ".admin-topbar", "Về học tập");
      await back.link.click();
      await expect(page).toHaveURL(/\/learn$/);
      await headerActions(page, ".learning-topbar", "Sang quản trị");
      if (role === "SYSTEM_ADMIN" && [360, 1440].includes(width))
        await page.screenshot({
          path: `.audit/evidence/workspace-switcher-${width}.png`,
          fullPage: false,
        });
      expect(errors).toEqual([]);
    });
  }
}

for (const [role, path] of [
  ["LEARNER", "/learn"],
  ["SYSTEM_ADMIN", "/admin"],
  ["CONTENT_ADMIN", "/admin"],
]) {
  test(`${role}: không hiện lối chuyển tới khu vực không có quyền`, async ({
    page,
  }) => {
    await mockSession(page, { ...learner, roles: [role] });
    await page.goto(path);
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ })
    ).toBeVisible();
    await expect(page.locator(".workspace-switcher")).toHaveCount(0);
  });
}
