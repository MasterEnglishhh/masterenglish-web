import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { fetchLearningGoal, updateLearningGoal } from "./goal-client.ts";

test("goal response with missing or mistyped fields is not an empty goal", () => withFetch(
  () => Response.json({ targetScore: "750", dailyMinutes: 30 }), async () => {
    assert.equal((await fetchLearningGoal()).success, false);
  }
));

function withFetch(
  handler: (url: string, init?: RequestInit) => Response,
  run: () => Promise<void>
) {
  const original = globalThis.fetch;
  globalThis.fetch = mock.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/csrf"))
        return new Response(
          JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
          { status: 200 }
        );
      return handler(url, init);
    }
  );
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test("a missing learning goal (404) is an empty state, not an error", () =>
  withFetch(
    () =>
      new Response(JSON.stringify({ detail: "Chưa thiết lập" }), {
        status: 404,
      }),
    async () => {
      const result = await fetchLearningGoal();
      assert.deepEqual(result, { success: true, data: null });
    }
  ));

test("server errors never show raw backend details", () =>
  withFetch(
    () =>
      new Response(JSON.stringify({ detail: "NullPointerException" }), {
        status: 500,
      }),
    async () => {
      const result = await fetchLearningGoal();
      assert.equal(result.success, false);
      if (result.success) return;
      assert.doesNotMatch(result.error.message, /NullPointer/);
    }
  ));

test("saving sends CSRF, maps an empty date to null and labels field violations", () => {
  let sent: { headers?: HeadersInit; body?: BodyInit | null } = {};
  return withFetch(
    (url, init) => {
      sent = { headers: init?.headers, body: init?.body };
      return new Response(
        JSON.stringify({
          detail: "Không hợp lệ",
          errors: [{ field: "targetScore" }],
        }),
        { status: 400 }
      );
    },
    async () => {
      const result = await updateLearningGoal({
        targetScore: 5,
        dailyMinutes: 30,
        targetDate: "",
      });
      assert.equal(
        new Headers(sent.headers).get("X-XSRF-TOKEN"),
        "test-csrf"
      );
      assert.deepEqual(JSON.parse(String(sent.body)), {
        targetScore: 5,
        dailyMinutes: 30,
        targetDate: null,
      });
      assert.equal(result.success, false);
      if (result.success) return;
      assert.equal(
        result.error.fieldErrors?.targetScore,
        "Điểm mục tiêu từ 10 đến 990."
      );
    }
  );
});
