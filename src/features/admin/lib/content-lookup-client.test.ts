import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createContentSource,
  fetchContentSources,
  searchPublishedSenses,
} from "./content-lookup-client.ts";

/** Thay `fetch`; trả lời CSRF cố định và ghi lại các yêu cầu còn lại. */
async function withFetch(handler: (url: string, init?: RequestInit) => Response, run: (urls: string[]) => Promise<void>) {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/csrf")) return new Response(JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "t" }), { status: 200 });
    urls.push(`${init?.method ?? "GET"} ${url}`);
    return handler(url, init);
  });
  try {
    await run(urls);
  } finally {
    globalThis.fetch = original;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("tìm nghĩa đã xuất bản: mã hóa từ khóa và trải mỗi nghĩa thành một dòng có thể chọn", async () => {
  await withFetch(
    () =>
      json({
        items: [
          {
            lemma: "schedule",
            senses: [
              { id: "s1", partOfSpeech: "NOUN", cefrLevel: "B1", meaningVi: "lịch trình" },
              { id: "s2", partOfSpeech: "VERB", cefrLevel: "B1", meaningVi: "lên lịch" },
            ],
          },
        ],
      }),
    async (urls) => {
      const res = await searchPublishedSenses(" sched ule&x ");
      assert.deepEqual(urls, ["GET /api/v1/vocabulary/words?q=sched%20ule%26x&size=10"]);
      assert.ok(res.success);
      assert.deepEqual(
        res.data.map((sense) => [sense.senseId, sense.lemma, sense.partOfSpeech]),
        [
          ["s1", "schedule", "NOUN"],
          ["s2", "schedule", "VERB"],
        ]
      );
    }
  );
});

test("tìm nghĩa lỗi máy chủ: trả lỗi để hộp thoại hiện thông báo", async () => {
  await withFetch(
    () => json({ detail: "Lỗi tạm thời" }, 503),
    async () => {
      const res = await searchPublishedSenses("x");
      assert.equal(res.success, false);
    }
  );
});

test("thêm nguồn mới gửi POST tới đúng đường dẫn quản trị", async () => {
  await withFetch(
    () => json({ id: "src-1", title: "N", sourceType: "EXTERNAL", licenseCode: "CC-BY", status: "ACTIVE" }, 201),
    async (urls) => {
      const res = await createContentSource({ title: "N", sourceType: "EXTERNAL", licenseCode: "CC-BY", attribution: "a" });
      assert.deepEqual(urls, ["POST /api/v1/admin/content/sources"]);
      assert.ok(res.success && res.data.id === "src-1");
    }
  );
});

test("fetchContentSources mặc định tải 100 nguồn cho dropdown", async () => {
  await withFetch(
    () => json({ items: [], totalItems: 0, totalPages: 1 }),
    async (urls) => {
      const res = await fetchContentSources();
      assert.deepEqual(urls, ["GET /api/v1/admin/content/sources?size=100"]);
      assert.ok(res.success);
    }
  );
});

test("fetchContentSources phân trang chuyển đổi trang 1-indexed thành 0-indexed và gửi search", async () => {
  await withFetch(
    () => json({ items: [], totalItems: 0, totalPages: 1 }),
    async (urls) => {
      const res = await fetchContentSources({ search: "Oxford", page: 3, size: 10 });
      assert.deepEqual(urls, ["GET /api/v1/admin/content/sources?search=Oxford&page=2&size=10"]);
      assert.ok(res.success);
    }
  );
});
