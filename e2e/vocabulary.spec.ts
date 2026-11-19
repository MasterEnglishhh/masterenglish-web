import { expect, test, type Page } from "@playwright/test";
import { learner, mockSession } from "./helpers";

const card = (n: number) => ({
  deckId: null,
  deckRevisionId: null,
  position: n,
  wordSenseId: `sense-${n}`,
  wordId: `word-${n}`,
  wordRevisionId: `rev-${n}`,
  lemma: `lemma${n}`,
  ipa: "/ˈlemə/",
  partOfSpeech: "noun",
  cefrLevel: "B1",
  meaningVi: `nghĩa số ${n}`,
  definitionEn: null,
  examples: [],
  audioUrl: null,
  isSaved: false,
  progress: null,
});

const reviewed = (sense: string) => ({
  reviewId: `review-${sense}`,
  wordSenseId: sense,
  rating: "GOOD",
  intervalDays: 1,
  easeFactor: 2.5,
  repetitions: 1,
  nextDueAt: "2099-01-01T00:00:00Z",
  progressVersion: 1,
});

async function mockReviewQueue(page: Page) {
  await mockSession(page, learner);
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({ json: { headerName: "X-XSRF-TOKEN", token: "test-token" } })
  );
  await page.route("**/api/v1/vocabulary/reviews/due**", (route) =>
    route.fulfill({ json: { totalDue: 2, cards: [card(1), card(2)] } })
  );
}

test("ôn tập: Space lật thẻ, phím 3 chấm Đã nhớ, lỗi 500 được gửi lại đúng cùng một yêu cầu", async ({ page }) => {
  await mockReviewQueue(page);
  const bodies: { rating: string; reviewRequestId: string }[] = [];
  let calls = 0;
  await page.route("**/api/v1/vocabulary/reviews", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bodies.push(route.request().postDataJSON());
    calls += 1;
    if (calls === 1) return route.fulfill({ status: 500, json: { title: "Lỗi máy chủ" } });
    return route.fulfill({ json: reviewed(`sense-${calls === 2 ? 1 : 2}`) });
  });

  await page.goto("/learn/review");
  await expect(page.getByText("Thẻ 1 / 2")).toBeVisible();
  const flip = page.getByRole("button", { name: /Lật thẻ xem nghĩa/ });
  await flip.focus();
  await page.locator("body").click({ position: { x: 5, y: 5 } }); // bỏ focus khỏi nút để phím tắt hoạt động
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Xem lại mặt trước thẻ" })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("3");
  await expect(page.getByRole("alert")).toBeVisible();
  const retry = page.getByRole("button", { name: "Gửi lại cùng đánh giá" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.getByText("Thẻ 2 / 2")).toBeVisible();

  expect(bodies).toHaveLength(2);
  expect(bodies[1].rating).toBe(bodies[0].rating);
  expect(bodies[1].reviewRequestId).toBe(bodies[0].reviewRequestId);

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Space");
  await page.keyboard.press("3");
  await expect(page.getByRole("heading", { name: "Hoàn thành lượt học!" })).toBeVisible();
  await expect(page.getByText("Đã lưu kết quả của 2 nghĩa từ.")).toBeVisible();
});

test("ôn tập: nút chấm bị khóa cho tới khi lật thẻ, chỉ báo tiến độ đúng", async ({ page }) => {
  await mockReviewQueue(page);
  await page.goto("/learn/review");
  const good = page.getByRole("button", { name: /Đã nhớ/ });
  await expect(good).toBeDisabled();
  await page.getByRole("button", { name: /Lật thẻ xem nghĩa/ }).click();
  await expect(good).toBeEnabled();
  await expect(page.getByRole("progressbar", { name: "Tiến độ lượt học" })).toHaveAttribute("aria-valuenow", "0");
});

test("lưu từ và bỏ lưu từ ngay trên thẻ", async ({ page }) => {
  await mockReviewQueue(page);
  const methods: string[] = [];
  await page.route("**/api/v1/vocabulary/saved-words/sense-1", (route) => {
    methods.push(route.request().method());
    return route.fulfill({ status: 204 });
  });
  await page.goto("/learn/review");
  const save = page.getByRole("button", { name: "Lưu từ" });
  await save.click();
  await expect(page.getByRole("button", { name: /Đã lưu · Bỏ lưu/ })).toBeVisible();
  await page.getByRole("button", { name: /Đã lưu · Bỏ lưu/ }).click();
  await expect(page.getByRole("button", { name: "Lưu từ" })).toBeVisible();
  expect(methods).toEqual(["PUT", "DELETE"]);
});

test("không có thẻ đến hạn: hiện trạng thái rỗng có lối sang học từ mới", async ({ page }) => {
  await mockSession(page, learner);
  await page.route("**/api/v1/vocabulary/reviews/due**", (route) => route.fulfill({ json: { totalDue: 0, cards: [] } }));
  await page.goto("/learn/review");
  await expect(page.getByRole("heading", { name: "Không có thẻ đến hạn" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Học từ mới" })).toHaveAttribute("href", "/learn/vocabulary");
});

test("lỗi tải hàng đợi: báo lỗi và nút thử tải lại gọi lại API", async ({ page }) => {
  await mockSession(page, learner);
  // Cờ thay cho đếm số lần gọi: ở chế độ dev React chạy hiệu ứng hai lần nên số lần gọi không ổn định.
  let failing = true;
  await page.route("**/api/v1/vocabulary/reviews/due**", (route) =>
    failing
      ? route.fulfill({ status: 500, json: { title: "Lỗi" } })
      : route.fulfill({ json: { totalDue: 0, cards: [] } })
  );
  await page.goto("/learn/review");
  await expect(page.getByRole("heading", { name: "Chưa tải được dữ liệu" })).toBeVisible();
  failing = false;
  await page.getByRole("button", { name: "Thử tải lại" }).click();
  await expect(page.getByRole("heading", { name: "Không có thẻ đến hạn" })).toBeVisible();
});
