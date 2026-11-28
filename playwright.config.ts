import { defineConfig } from "@playwright/test";

const port = 3000;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

/**
 * Kiểm tra giao diện bằng trình duyệt thật (`npm run test:e2e`).
 * Mặc định dùng Microsoft Edge có sẵn nên không phải tải trình duyệt; máy không có Edge thì chạy
 * `npx playwright install chromium` rồi đặt `E2E_CHANNEL=chromium`.
 * Gặp dev server đang chạy ở cổng 3000 thì dùng lại, nếu không thì tự khởi động một cái.
 */
export default defineConfig({
  workers: process.env.CI ? undefined : 1,
  testDir: "./e2e",
  testIgnore: ["**/real/**"],
  outputDir: "./test-results",
  reporter: [["list"]],
  use: {
    baseURL,
    channel: process.env.E2E_CHANNEL ?? "msedge",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        // Trang chủ không cần backend; địa chỉ này chỉ để Next khởi động được.
        env: { BACKEND_URL: process.env.BACKEND_URL ?? "http://127.0.0.1:9" },
      },
});
