import { expect, test } from "@playwright/test";
import { admin, learner, mockSession } from "./helpers";

/** Ghi lại mọi lần khối trượt bị ghi style, kèm transition đang áp dụng ở thời điểm đó. */
async function recordIndicator(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __slideLog: string[] }).__slideLog = log;
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as HTMLElement;
        if (el.classList?.contains("slide-indicator")) log.push(getComputedStyle(el).transitionDuration);
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
}

const indicatorBox = (page: import("@playwright/test").Page, scope: string) =>
  page.locator(`${scope} > .slide-indicator`).first().evaluate((el) => ({
    transform: (el as HTMLElement).style.transform,
    width: (el as HTMLElement).style.width,
  }));

test.describe("đăng nhập ↔ đăng ký ↔ quên mật khẩu", () => {
  test("khung và thanh tab không bị dựng lại, khối trượt đổi vị trí", async ({ page }) => {
    await mockSession(page, null);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");

    const tabs = page.locator(".auth-tabs");
    await expect(tabs).toHaveAttribute("data-slide", "on");
    await tabs.evaluate((el) => (el.dataset.marker = "giữ"));
    await page.locator(".auth-shell").evaluate((el) => (el.dataset.marker = "giữ"));
    const before = await indicatorBox(page, ".auth-tabs");

    await page.getByRole("link", { name: "Tạo tài khoản" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("hành trình");

    await expect(tabs).toHaveAttribute("data-marker", "giữ");
    await expect(page.locator(".auth-shell")).toHaveAttribute("data-marker", "giữ");
    const after = await indicatorBox(page, ".auth-tabs");
    expect(after.transform).not.toBe(before.transform);
  });

  test("khối trượt đi qua các vị trí trung gian, không nhảy thẳng", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login");
    await expect(page.locator(".auth-tabs")).toHaveAttribute("data-slide-ready", "true");
    const xs = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const indicator = document.querySelector(".auth-tabs > .slide-indicator") as HTMLElement;
          const out: number[] = [];
          (document.querySelectorAll(".auth-tabs a")[1] as HTMLElement).click();
          let frames = 0;
          const tick = () => {
            out.push(Math.round(new DOMMatrix(getComputedStyle(indicator).transform).m41));
            if (++frames < 360) requestAnimationFrame(tick); // tối đa ~6s: dev server có thể biên dịch route lần đầu
            else resolve(out);
          };
          requestAnimationFrame(tick);
        })
    );
    const start = xs[0];
    const end = xs[xs.length - 1];
    expect(end).toBeGreaterThan(start + 100);
    const between = new Set(xs.filter((x) => x > start + 5 && x < end - 5));
    expect(between.size, `các vị trí đã đi qua: ${[...new Set(xs)].join(" ")}`).toBeGreaterThanOrEqual(4);
  });

  test("đi tới thì trượt vào từ phải, quay lại thì từ trái", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login");
    const content = page.locator(".auth-card .route-transition").last();
    await expect(content).toHaveAttribute("data-direction", "none");

    await page.getByRole("link", { name: "Tạo tài khoản" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator(".auth-card .route-transition").last()).toHaveAttribute("data-direction", "forward");

    await page.getByRole("link", { name: "Đăng nhập", exact: true }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator(".auth-card .route-transition").last()).toHaveAttribute("data-direction", "back");
  });

  test("lần tải đầu khối trượt đặt vị trí ngay, không chạy transition", async ({ page }) => {
    await mockSession(page, null);
    await recordIndicator(page);
    await page.goto("/register");
    await expect(page.locator(".auth-tabs")).toHaveAttribute("data-slide-ready", "true");
    const log = await page.evaluate(() => (window as unknown as { __slideLog: string[] }).__slideLog);
    expect(log.length).toBeGreaterThan(0);
    expect(log[0]).toBe("0s");
  });

  test("tham số redirect được giữ khi bấm qua lại giữa các tab", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login?redirect=%2Flearn%2Fvocabulary");
    await page.getByRole("link", { name: "Tạo tài khoản" }).click();
    await expect(page).toHaveURL(/\/register\?redirect=%2Flearn%2Fvocabulary$/);
    await page.getByRole("link", { name: "Đăng nhập", exact: true }).first().click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Flearn%2Fvocabulary$/);
  });

  test("sang quên mật khẩu thì thanh tab biến mất, quay lại thì hiện lại và vẫn đo đúng", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login");
    await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.locator(".auth-tabs")).toHaveCount(0);
    await page.getByRole("link", { name: /Quay lại đăng nhập/ }).click();
    await expect(page.locator(".auth-tabs")).toHaveAttribute("data-slide", "on");
  });
});

test.describe("khu học tập và từ vựng", () => {
  test("thanh điều hướng khu học: khối nền trượt dọc, thanh không bị dựng lại", async ({ page }) => {
    await mockSession(page, learner);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/learn");
    const nav = page.locator(".learning-sidebar .learning-nav");
    await expect(nav).toHaveAttribute("data-slide", "on");
    await nav.evaluate((el) => (el.dataset.marker = "giữ"));
    const before = await indicatorBox(page, ".learning-sidebar .learning-nav");

    await nav.getByRole("link", { name: "Luyện TOEIC" }).click();
    await expect(page).toHaveURL(/\/learn\/toeic$/);
    await expect(nav).toHaveAttribute("data-marker", "giữ");
    const after = await indicatorBox(page, ".learning-sidebar .learning-nav");
    expect(after.transform).not.toBe(before.transform);
    // đi từ Tổng quan xuống Luyện TOEIC: nội dung trượt xuống
    await expect(page.locator(".learning-main > .route-transition")).toHaveAttribute("data-direction", "forward");
  });

  test("tab từ vựng: khối nền trượt giữa ba mục và nội dung trượt theo chiều", async ({ page }) => {
    await mockSession(page, learner);
    await page.route("**/api/v1/vocabulary/**", (route) =>
      route.fulfill({ json: { items: [], page: 0, size: 12, totalItems: 0, totalPages: 0, hasNext: false, totalDue: 0, cards: [] } })
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/learn/vocabulary");
    const tabs = page.getByRole("navigation", { name: "Danh mục từ vựng" });
    await expect(tabs).toHaveAttribute("data-slide", "on");
    const before = await tabs.locator(".slide-indicator").evaluate((el) => (el as HTMLElement).style.transform);
    await tabs.getByRole("button", { name: "Tra từ" }).click();
    await expect(page).toHaveURL(/view=words/);
    const after = await tabs.locator(".slide-indicator").evaluate((el) => (el as HTMLElement).style.transform);
    expect(after).not.toBe(before);
    await expect(page.locator("[data-direction='forward']").last()).toBeVisible();
    await tabs.getByRole("button", { name: "Bộ từ" }).click();
    await expect(page.locator("[data-direction='back']").last()).toBeVisible();
  });

  test("thanh điều hướng ngang trên điện thoại tự cuộn mục đang chọn vào vùng nhìn", async ({ page }) => {
    await mockSession(page, learner);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/learn");
    const nav = page.locator(".mobile-learning-nav .learning-nav");
    await expect(nav).toHaveAttribute("data-slide", "on");
    await nav.getByRole("link", { name: "AI Tutor" }).scrollIntoViewIfNeeded();
    await nav.getByRole("link", { name: "AI Tutor" }).click();
    await expect(page).toHaveURL(/\/learn\/ai-tutor$/);
    const inView = await nav.getByRole("link", { name: "AI Tutor" }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= -1 && r.right <= window.innerWidth + 1;
    });
    expect(inView).toBe(true);
  });
});

/** Ghi độ tràn ngang lớn nhất của trang trong lúc đang chạy một thao tác chuyển trang/tab. */
async function maxOverflowDuring(page: import("@playwright/test").Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    const w = window as unknown as { __maxOverflow: number; __sampling: boolean };
    w.__maxOverflow = -Infinity;
    w.__sampling = true;
    const tick = () => {
      w.__maxOverflow = Math.max(w.__maxOverflow, document.documentElement.scrollWidth - window.innerWidth);
      if (w.__sampling) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await action();
  await page.waitForTimeout(700); // đủ cho animation 0,26s kết thúc
  return page.evaluate(() => {
    const w = window as unknown as { __maxOverflow: number; __sampling: boolean };
    w.__sampling = false;
    return w.__maxOverflow;
  });
}

test.describe("không tràn ngang giữa lúc chuyển động ở 360px", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("khu học: chuyển mục", async ({ page }) => {
    await mockSession(page, learner);
    await page.goto("/learn");
    const nav = page.locator(".mobile-learning-nav .learning-nav");
    await expect(nav).toHaveAttribute("data-slide", "on");
    const max = await maxOverflowDuring(page, async () => {
      await nav.getByRole("link", { name: "Luyện TOEIC" }).click();
      await expect(page).toHaveURL(/toeic$/);
    });
    expect(max).toBeLessThanOrEqual(0);
  });

  test("đăng nhập sang đăng ký", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login");
    const max = await maxOverflowDuring(page, async () => {
      await page.getByRole("link", { name: "Tạo tài khoản" }).click();
      await expect(page).toHaveURL(/register$/);
    });
    expect(max).toBeLessThanOrEqual(0);
  });

  test("tab từ vựng", async ({ page }) => {
    await mockSession(page, learner);
    await page.route("**/api/v1/vocabulary/**", (route) =>
      route.fulfill({ json: { items: [], page: 0, size: 12, totalItems: 0, totalPages: 0, hasNext: false, totalDue: 0, cards: [] } })
    );
    await page.goto("/learn/vocabulary");
    const tabs = page.getByRole("navigation", { name: "Danh mục từ vựng" });
    const max = await maxOverflowDuring(page, async () => {
      await tabs.getByRole("button", { name: "Tra từ" }).click();
      await expect(page).toHaveURL(/view=words/);
    });
    expect(max).toBeLessThanOrEqual(0);
  });

  test("quản trị: chuyển mục", async ({ page }) => {
    await mockSession(page, admin);
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Điều hướng quản trị" });
    const max = await maxOverflowDuring(page, async () => {
      await nav.getByRole("link", { name: "Người dùng & Quyền" }).click();
      await expect(page).toHaveURL(/users$/);
    });
    expect(max).toBeLessThanOrEqual(0);
  });
});

test.describe("khi người dùng bật giảm chuyển động", () => {
  test.use({ reducedMotion: "reduce" });

  test("khối trượt và nội dung chuyển tức thì, không còn hoạt ảnh", async ({ page }) => {
    await mockSession(page, null);
    await page.goto("/login");
    await expect(page.locator(".auth-tabs")).toHaveAttribute("data-slide-ready", "true");
    await page.getByRole("link", { name: "Tạo tài khoản" }).click();
    await expect(page).toHaveURL(/\/register$/);
    const motion = await page.evaluate(() => {
      const indicator = document.querySelector(".auth-tabs > .slide-indicator") as HTMLElement;
      const content = document.querySelector(".auth-card .route-transition") as HTMLElement;
      return {
        transition: getComputedStyle(indicator).transitionDuration,
        animation: getComputedStyle(content).animationName,
      };
    });
    expect(motion.transition).toBe("0s");
    expect(motion.animation).toBe("none");
  });
});
