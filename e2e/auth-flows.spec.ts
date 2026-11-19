import { expect, test, type Page } from "@playwright/test";
import { mockSession } from "./helpers";

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const future = () => new Date(Date.now() + 10 * 60_000).toISOString();
const challenge = (idKey: string) => ({
  [idKey]: UUID,
  expiresAt: future(),
  resendAfterSeconds: 60,
  message: "Đã gửi mã.",
});
const PASSWORD = "mot cum tu dai de nho";

async function mockAuthApi(page: Page) {
  await mockSession(page, null);
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { headerName: "X-XSRF-TOKEN", token: "test-token" } })
  );
}

test("đăng ký: form trống báo lỗi từng trường và đưa con trỏ về ô đầu tiên lỗi", async ({ page }) => {
  await mockAuthApi(page);
  await page.goto("/register");
  await page.getByRole("button", { name: "Tiếp tục và nhận mã xác minh" }).click();
  await expect(page.getByText("Vui lòng nhập họ và tên đệm.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập tên của bạn.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập địa chỉ email hợp lệ.")).toBeVisible();
  await expect(page.getByLabel("Họ và tên đệm")).toBeFocused();
});

test("đăng ký: danh sách điều kiện mật khẩu chuyển sang đạt khi đủ 15 ký tự", async ({ page }) => {
  await mockAuthApi(page);
  await page.goto("/register");
  const list = page.getByRole("list", { name: "Yêu cầu mật khẩu" });
  await expect(list.getByText("chưa đạt")).toHaveCount(2); // mật khẩu rỗng: cả hai điều kiện chưa đạt
  await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
  await expect(list.getByText("chưa đạt")).toHaveCount(0);
  await expect(list.getByText("đã đạt")).toHaveCount(2);
});

test("đăng ký: gửi thông tin, nhập OTP, rồi chuyển về đăng nhập kèm thông báo", async ({ page }) => {
  await mockAuthApi(page);
  const requests: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/register", (route) => {
    requests.register = route.request().postDataJSON();
    return route.fulfill({ json: challenge("registrationId") });
  });
  await page.route("**/api/v1/auth/register/verify", (route) => {
    requests.verify = route.request().postDataJSON();
    return route.fulfill({ status: 204 });
  });
  await page.goto("/register");
  await page.getByLabel("Họ và tên đệm").fill("Nguyễn Hoàng");
  await page.getByLabel("Tên", { exact: true }).fill("An");
  await page.getByLabel("Email của bạn").fill("an@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Tiếp tục và nhận mã xác minh" }).click();

  await expect(page.getByRole("heading", { name: "Kiểm tra hộp thư của bạn" })).toBeVisible();
  expect(requests.register).toMatchObject({ email: "an@example.com", firstName: "An", lastName: "Nguyễn Hoàng" });

  await page.getByRole("textbox", { name: /mã/i }).fill("123456");
  await page.getByRole("button", { name: /Xác minh/ }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/);
  expect(requests.verify).toMatchObject({ otp: "123456", registrationId: UUID });
});

test("đăng ký: OTP sai hiện lỗi ngay ở ô mã và xóa mã đã nhập", async ({ page }) => {
  await mockAuthApi(page);
  await page.route("**/api/v1/auth/register", (route) => route.fulfill({ json: challenge("registrationId") }));
  await page.route("**/api/v1/auth/register/verify", (route) =>
    route.fulfill({ status: 400, contentType: "application/problem+json", json: { code: "OTP_INVALID", title: "Mã chưa đúng.", status: 400 } })
  );
  await page.goto("/register");
  await page.getByLabel("Họ và tên đệm").fill("Nguyễn Hoàng");
  await page.getByLabel("Tên", { exact: true }).fill("An");
  await page.getByLabel("Email của bạn").fill("an@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Tiếp tục và nhận mã xác minh" }).click();
  const otp = page.getByRole("textbox", { name: /mã/i });
  await otp.fill("000000");
  await page.getByRole("button", { name: /Xác minh/ }).click();
  await expect(otp).toHaveValue("");
  await expect(otp).toBeFocused();
});

test("quên mật khẩu: email, OTP, mật khẩu mới rồi về đăng nhập", async ({ page }) => {
  await mockAuthApi(page);
  const requests: Record<string, unknown> = {};
  await page.route("**/api/v1/auth/password/forgot", (route) => route.fulfill({ json: challenge("challengeId") }));
  await page.route("**/api/v1/auth/password/verify", (route) =>
    route.fulfill({ json: { resetToken: "a".repeat(64), expiresAt: future() } })
  );
  await page.route("**/api/v1/auth/password/reset", (route) => {
    requests.reset = route.request().postDataJSON();
    return route.fulfill({ status: 204 });
  });
  await page.goto("/forgot-password");
  await page.getByLabel("Email tài khoản").fill("an@example.com");
  await page.getByRole("button", { name: "Gửi mã xác minh" }).click();
  await page.getByLabel("Mã xác minh").fill("654321");
  await page.getByRole("button", { name: "Xác minh mã OTP" }).click();

  const list = page.getByRole("list", { name: "Yêu cầu mật khẩu" });
  await expect(list).toBeVisible();
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("ngan");
  await expect(list.getByText("chưa đạt")).toHaveCount(1);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu mới").fill(PASSWORD);
  await expect(list.getByText("đã đạt")).toHaveCount(2);
  await page.getByRole("button", { name: /Đặt lại|Cập nhật|Lưu/ }).click();
  await expect.poll(() => requests.reset).toMatchObject({ email: "an@example.com", resetToken: "a".repeat(64) });
});
