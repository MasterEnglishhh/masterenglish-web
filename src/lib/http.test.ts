import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { requestJson, retryAfterSeconds } from "./http.ts";

const csrf = () =>
  new Response(
    JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
    { status: 200 }
  );

/** Thay `fetch`; CSRF luôn thành công, mọi yêu cầu khác do `handler` trả về. */
async function withFetch(
  handler: (url: string, init?: RequestInit) => Response,
  run: (calls: { url: string; init?: RequestInit }[]) => Promise<void>
) {
  const original = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = mock.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/csrf")) return csrf();
      calls.push({ url, init });
      return handler(url, init);
    }
  );
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

test("PATCH carries the CSRF header and a JSON body; GET carries neither", () =>
  withFetch(
    () => new Response("{}", { status: 200 }),
    async (calls) => {
      await requestJson("/api/x", { method: "PATCH", body: { a: 1 } });
      await requestJson("/api/x");
      const patch = calls[0].init!;
      assert.equal(
        (patch.headers as Record<string, string>)["X-XSRF-TOKEN"],
        "test-csrf"
      );
      assert.equal(patch.body, '{"a":1}');
      const get = calls[1].init!;
      assert.equal(
        (get.headers as Record<string, string>)["X-XSRF-TOKEN"],
        undefined
      );
      assert.equal(get.body, undefined);
    }
  ));

test("a problem+json error keeps its body and Retry-After", () =>
  withFetch(
    () =>
      new Response(JSON.stringify({ code: "RATE_LIMITED", detail: "x" }), {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": "30",
        },
      }),
    async () => {
      const out = await requestJson("/api/x");
      assert.equal(out.ok, false);
      if (out.ok) return;
      assert.equal(out.reason, "http");
      assert.equal(out.status, 429);
      assert.equal(out.problem?.code, "RATE_LIMITED");
      assert.equal(out.retryAfterSeconds, 30);
    }
  ));

test("a 200 that is not JSON (misconfigured proxy) is a failure, not a crash", () =>
  withFetch(
    () => new Response("<html>oops</html>", { status: 200 }),
    async () => {
      const out = await requestJson("/api/x");
      assert.equal(out.ok, false);
      if (out.ok) return;
      assert.equal(out.reason, "http");
      assert.equal(out.status, 200);
    }
  ));

test("204 is a success with no data", () =>
  withFetch(
    () => new Response(null, { status: 204 }),
    async () => {
      const out = await requestJson("/api/x", { method: "DELETE" });
      assert.deepEqual(out, { ok: true, status: 204, data: undefined });
    }
  ));

test("a 401 that survives one refresh is reported as an expired session", async () => {
  let refreshes = 0;
  await withFetch(
    (url) => {
      if (url.includes("/auth/refresh")) {
        refreshes++;
        return new Response(null, { status: 204 });
      }
      return new Response(null, { status: 401 });
    },
    async (calls) => {
      const out = await requestJson("/api/x");
      assert.equal(out.ok, false);
      if (out.ok) return;
      assert.equal(out.reason, "session");
      assert.equal(out.status, 401);
      assert.equal(refreshes, 1, "refresh exactly once");
      assert.equal(
        calls.filter((c) => c.url === "/api/x").length,
        2,
        "retried only once"
      );
    }
  );
});

test("retryAfterSeconds reads seconds, HTTP dates and ignores junk", () => {
  assert.equal(retryAfterSeconds("12"), 12);
  assert.equal(retryAfterSeconds("0"), null);
  assert.equal(retryAfterSeconds("soon"), null);
  assert.equal(retryAfterSeconds(null), null);
  const future = new Date(Date.now() + 60_000).toUTCString();
  const seconds = retryAfterSeconds(future)!;
  assert.ok(seconds > 50 && seconds <= 61);
});
