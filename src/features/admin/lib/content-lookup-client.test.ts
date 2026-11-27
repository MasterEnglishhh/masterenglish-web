import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createContentSource, searchPublishedSenses } from "./content-lookup-client.ts";

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
const senseId1 = "82380ce1-d339-471a-9cb2-9788b8759248";
const senseId2 = "d969f673-c2b5-4b2b-8088-e475868b7509";

test("tìm nghĩa đã xuất bản: mã hóa từ khóa và trải mỗi nghĩa thành một dòng có thể chọn", async () => {
  await withFetch(
    () =>
      json({
        page: 0, size: 10, totalItems: 1, totalPages: 1, hasNext: false,
        items: [
          {
            lemma: "schedule",
            senses: [
              { id: senseId1, partOfSpeech: "NOUN", cefrLevel: "B1", meaningVi: "lịch trình" },
              { id: senseId2, partOfSpeech: "VERB", cefrLevel: "B1", meaningVi: "lên lịch" },
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
          [senseId1, "schedule", "NOUN"],
          [senseId2, "schedule", "VERB"],
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

test("từ vựng thiếu danh sách nghĩa được báo lỗi thay vì làm hỏng bộ chọn", async () => {
  await withFetch(
    () => json({ items: [{ lemma: "keep" }], page: 0, size: 10, totalItems: 1, totalPages: 1, hasNext: false }),
    async () => {
      const res = await searchPublishedSenses("keep");
      assert.equal(res.success, false);
      if (!res.success) assert.equal(res.error.code, "INVALID_RESPONSE");
    }
  );
});

test("thêm nguồn mới gửi POST tới đúng đường dẫn quản trị", async () => {
  const id = "bfd43b4f-a3d8-4af3-b0e6-c5a99c30350e";
  await withFetch(
    () => json({ id, title: "N", sourceType: "EXTERNAL", licenseCode: "CC-BY", status: "ACTIVE", sourceUrl: null, author: null, createdAt: "2026-11-28T00:00:00Z" }, 201),
    async (urls) => {
      const res = await createContentSource({ title: "N", sourceType: "EXTERNAL", licenseCode: "CC-BY", attribution: "a" });
      assert.deepEqual(urls, ["POST /api/v1/admin/content/sources"]);
      assert.ok(res.success && res.data.id === id);
    }
  );
});
