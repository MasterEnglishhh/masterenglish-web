import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(
  readFileSync(".audit/runtime/backend/acceptance-credentials.json", "utf8")
);
if (
  fixture.baseUrl !== "http://127.0.0.1:28081" ||
  !fixture.learner.email.endsWith("@acceptance.invalid")
) {
  throw new Error(
    "Nghiệm thu chỉ được chạy với fixture và backend audit riêng."
  );
}

async function csrf(request: APIRequestContext) {
  const response = await request.get("/api/v1/auth/csrf");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const state = await request.storageState();
  const cookie = state.cookies.find((value) => value.name === "XSRF-TOKEN");
  return {
    "X-XSRF-TOKEN": cookie ? decodeURIComponent(cookie.value) : body.token,
  };
}

async function login(page: Page, account = fixture.learner) {
  await page.addInitScript(() => localStorage.setItem("me_intro_seen", "1"));
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(fixture.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/(learn|admin)(?:\?|$)/);
  const me = await page.request.get("/api/v1/users/me");
  expect(me.status()).toBe(200);
  expect((await me.json()).id).toBe(account.id);
}

async function layout(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(1);
  const clipped = await page
    .locator(
      "main button:visible, main input:visible, main select:visible, main h1:visible, main h2:visible"
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.left < -1 || box.right > innerWidth + 1;
        })
        .map((element) => ({
          tag: element.tagName,
          label: element.textContent?.slice(0, 80),
        }))
    );
  expect(
    clipped,
    "Điều khiển hoặc tiêu đề bị cắt ngang dù trang không có scrollbar"
  ).toEqual([]);
}

async function submit(page: Page) {
  await expect(
    page.getByRole("button", { name: "Nộp bài", exact: true }).first()
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Nộp bài", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Xác nhận nộp bài", exact: true })
    .click();
  await expect(page).toHaveURL(/\/learn\/results\?.*attempt=/);
  await expect(
    page.getByRole("heading", { name: "Đáp án và lời giải", exact: true })
  ).toBeVisible();
}

test("grammar thật: lesson, save bị mất phản hồi, replay đúng key, reload và nộp xem kết quả", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.goto(`/learn/grammar?lesson=${fixture.lessonId}`);
  await expect(
    page.getByRole("heading", {
      name: "At, on and in in everyday schedules",
      exact: true,
    })
  ).toBeVisible();
  const complete = page.getByRole("button", {
    name: /Hoàn thành bài học|Đã hoàn thành bài học/,
  });
  if (await complete.isEnabled()) await complete.click();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành bài học", exact: true })
  ).toBeVisible();
  await page.getByRole("link", { name: "Luyện chủ điểm này" }).click();
  await page.getByLabel("Số câu", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Bắt đầu luyện", exact: true })
    .click();
  await expect(page).toHaveURL(/\/learn\/practice\?attempt=/);
  const attemptId = new URL(page.url()).searchParams.get("attempt")!;
  const publicView = await page.request.get(`/api/v1/attempts/${attemptId}`);
  expect(publicView.status()).toBe(200);
  expect(await publicView.text()).not.toMatch(
    /"(?:correctOptionId|explanation|optionTranscripts|promptTranscript|isCorrect)"\s*:/
  );
  const early = await page.request.get(`/api/v1/attempts/${attemptId}/results`);
  expect(early.status()).toBe(409);
  const saves: { key: string; body: string | null }[] = [];
  await page.route("**/api/v1/attempts/*/answers/*", async (route) => {
    saves.push({
      key: route.request().headers()["idempotency-key"],
      body: route.request().postData(),
    });
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (saves.length === 1) await route.abort("failed");
    else await route.fulfill({ response });
  });
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Thử đồng bộ lại" })
  ).toBeVisible();
  await page.getByRole("radio").nth(1).check();
  await expect(
    page.getByRole("button", { name: "Thử đồng bộ lại" })
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Nộp bài", exact: true }).first()
  ).toBeDisabled();
  await page.getByRole("button", { name: "Thử đồng bộ lại" }).click();
  await expect(
    page.getByText("Đã lưu tất cả đáp án", { exact: true })
  ).toBeVisible();
  expect(saves).toHaveLength(2);
  expect(saves[1]).toEqual(saves[0]);
  const persisted = await (
    await page.request.get(`/api/v1/attempts/${attemptId}`)
  ).json();
  const slots = Object.values(persisted.savedAnswers) as { version: number }[];
  expect(slots.filter((slot) => slot.version === 1)).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await layout(page);
  await page.screenshot({
    path: `.audit/evidence/grammar-attempt-${info.project.name}.png`,
    fullPage: true,
  });
  await submit(page);
  const result = await page.request.get(
    `/api/v1/attempts/${attemptId}/results`
  );
  expect(result.status()).toBe(200);
  expect((await result.json()).status).toBe("SUBMITTED");
  await expect(page.getByText(/Đáp án đúng:/).first()).toBeVisible();
  await layout(page);
  expect(errors).toEqual([]);
});

test("TOEIC thật: catalog, tiếp tục lượt đã lưu và kết quả không bịa điểm 990", async ({
  page,
}, info) => {
  await login(page);
  await page.goto("/learn/toeic");
  await expect(
    page.getByRole("link", { name: "Xem bộ đề" }).first()
  ).toBeVisible();
  await page.goto(`/learn/toeic?set=${fixture.toeicSetId}`);
  await page
    .getByRole("button", { name: "Bắt đầu luyện", exact: true })
    .click();
  await expect(page).toHaveURL(/\/learn\/practice\?attempt=/);
  await page.getByRole("radio").first().check();
  await expect(
    page.getByText("Đã lưu tất cả đáp án", { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await layout(page);
  await submit(page);
  await expect(page.locator("main")).not.toContainText(/\/\s*990/);
  await page.screenshot({
    path: `.audit/evidence/toeic-result-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/learn/results?category=TOEIC&status=SUBMITTED");
  await expect(
    page.getByRole("link", { name: "Xem kết quả" }).first()
  ).toBeVisible();
  await layout(page);
});

test("thông báo thật: feed, đọc, tùy chọn và ranh giới quyền admin", async ({
  page,
}, info) => {
  await login(page);
  await page.locator('a[href="/learn/notifications"]:visible').first().click();
  await expect(
    page.getByRole("heading", { name: "Thông báo", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Hoàn thành mục tiêu hôm nay", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click();
  await expect(page.getByText("0 chưa đọc", { exact: true })).toBeVisible();
  await layout(page);
  await page.screenshot({
    path: `.audit/evidence/notifications-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Tùy chọn nhận thông báo" }).click();
  await expect(
    page.getByRole("button", { name: "Lưu tùy chọn thông báo" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Lưu tùy chọn thông báo" }).click();
  await expect(page.getByText(/Đã lưu tùy chọn/)).toBeVisible();
  const denied = await page.request.get("/api/v1/admin/notifications/rules");
  expect(denied.status()).toBe(403);
  const noCsrf = await page.request.post("/api/v1/notifications/read-all");
  expect(noCsrf.status()).toBe(403);
  const foreign = await page.request.post(
    "/api/v1/notifications/e9970000-0060-4000-8000-000000000002/read",
    { headers: await csrf(page.request) }
  );
  expect(foreign.status()).toBe(404);
});

test("admin thật: xem deliveries/rules/history và lưu quy tắc bằng API", async ({
  page,
}, info) => {
  await login(page, fixture.admin);
  await page.locator('a[href="/admin/notifications"]:visible').first().click();
  await expect(
    page.getByRole("heading", { name: "Quản trị thông báo", exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Quy tắc", exact: true }).click();
  const save = page
    .getByRole("button", { name: "Lưu quy tắc", exact: true })
    .first();
  await expect(save).toBeVisible();
  await save.click();
  await expect(page.getByText(/Đã lưu/).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Lịch sử nhắc học", exact: true })
    .click();
  await layout(page);
  await page.screenshot({
    path: `.audit/evidence/admin-notifications-${info.project.name}.png`,
    fullPage: true,
  });
});

test("bài luyện thật: chặn rời khi chưa lưu, đồng bộ rồi tiếp tục từ lịch sử", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/learn/grammar?topic=${fixture.topicId}&mode=practice`);
  await page.getByLabel("Số câu", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Bắt đầu luyện", exact: true })
    .click();
  await expect(page).toHaveURL(/\/learn\/practice\?attempt=/);
  const id = new URL(page.url()).searchParams.get("attempt")!;
  const initial = await (
    await page.request.get(`/api/v1/attempts/${id}`)
  ).json();
  let committed!: () => void;
  let release!: () => void;
  const persisted = new Promise<void>((resolve) => {
    committed = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let first = true;
  await page.route("**/api/v1/attempts/*/answers/*", async (route) => {
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (first) {
      first = false;
      committed();
      await gate;
      await route.abort("failed");
    } else await route.fulfill({ response });
  });
  try {
    await page
      .getByRole("group", { name: "Đáp án câu 1", exact: true })
      .getByRole("radio")
      .first()
      .check();
    await persisted;
    const second = page
      .getByRole("group", { name: "Đáp án câu 2", exact: true })
      .getByRole("radio")
      .nth(1);
    await second.check();
    const selected = await second.inputValue();
    await page
      .getByRole("link", { name: "Lịch sử bài luyện", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Đáp án chưa lưu xong" })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ở lại lưu đáp án", exact: true })
      .click();
    await expect(page).toHaveURL(/\/learn\/practice\?attempt=/);
    release();
    await page
      .getByRole("button", { name: "Thử đồng bộ lại", exact: true })
      .click();
    await expect(
      page.getByText("Đã lưu tất cả đáp án", { exact: true })
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Lịch sử bài luyện", exact: true })
      .click();
    await expect(page).toHaveURL(/\/learn\/results/);
    await page.goBack();
    await expect(
      page
        .getByRole("group", { name: "Đáp án câu 2", exact: true })
        .getByRole("radio")
        .nth(1)
    ).toBeChecked();
    await expect(
      page.getByText("Đã lưu tất cả đáp án", { exact: true })
    ).toBeVisible();
    const fresh = await (
      await page.request.get(`/api/v1/attempts/${id}`)
    ).json();
    expect(fresh.savedAnswers[initial.questions[1].snapshotId]).toMatchObject({
      selectedOptionId: selected,
      version: 1,
    });
    await submit(page);
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("đổi cookie sang tài khoản khác không phát lại hồ sơ cũ dưới danh tính mới", async ({
  page,
}) => {
  await login(page);
  await page.goto("/learn/account");
  await expect(
    page.getByRole("button", { name: "Lưu hồ sơ", exact: true })
  ).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let actor = "";
  // Trì hoãn refresh UI để tái hiện tab còn giữ danh tính A trong khi cookie đã là B.
  await page.route("**/api/v1/users/me", async (route) => {
    if (route.request().method() === "GET") await gate;
    else actor = route.request().headers()["x-session-user"];
    await route.continue();
  });
  try {
    const switched = await page.request.post("/api/v1/auth/login", {
      headers: await csrf(page.request),
      data: { email: fixture.other.email, password: fixture.password },
    });
    expect(switched.status()).toBe(200);
    const before = await (await page.request.get("/api/v1/users/me")).json();
    expect(before.id).toBe(fixture.other.id);
    await page.getByLabel("Tên", { exact: true }).fill("Private draft from A");
    const rejection = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/users/me") &&
        response.request().method() === "PUT"
    );
    await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
    expect((await rejection).status()).toBe(403);
    expect(actor).toBe(fixture.learner.id);
    const after = await (await page.request.get("/api/v1/users/me")).json();
    expect(after).toEqual(before);
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});
