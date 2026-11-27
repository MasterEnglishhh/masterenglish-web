import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { requestJson, retryAfterSeconds } from "./http.ts";
import { sessionIdentity } from "./session.ts";

const csrf = () =>
  new Response(
    JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
    { status: 200 }
  );

test("a mutation keeps its initiating actor when cookies change during CSRF bootstrap", async () => {
  const originalFetch = globalThis.fetch;
  const originalIdentity = sessionIdentity.userId;
  const actor = "10000000-0000-0000-0000-000000000001";
  const other = "10000000-0000-0000-0000-000000000002";
  sessionIdentity.userId = actor;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/csrf")) {
      sessionIdentity.userId = other;
      return csrf();
    }
    assert.equal(new Headers(init?.headers).get("X-Session-User"), actor);
    return new Response(null, { status: 403 });
  };
  try {
    const result = await requestJson("/api/v1/users/me", {
      method: "PUT",
      body: { firstName: "A" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 403);
  } finally {
    sessionIdentity.userId = originalIdentity;
    globalThis.fetch = originalFetch;
  }
});

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
      assert.equal(new Headers(patch.headers).get("X-XSRF-TOKEN"), "test-csrf");
      assert.equal(patch.body, '{"a":1}');
      const get = calls[1].init!;
      assert.equal(new Headers(get.headers).get("X-XSRF-TOKEN"), null);
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

test("204 cannot bypass a required response DTO", () =>
  withFetch(
    () => new Response(null, { status: 204 }),
    async () => {
      const result = await requestJson("/api/v1/users/me", {
        validate: (data) => typeof data === "object" && data !== null,
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.problem?.code, "INVALID_RESPONSE");
    }
  ));

test("API requests reject external and normalized non-API paths before sending CSRF", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return csrf();
  };
  try {
    for (const path of [
      "https://evil.test/api/x",
      "//evil.test/api/x",
      "/outside",
      "/api/../../outside",
      "/api/%2e%2e/outside",
      "/api/..\\outside",
      "/api/\nx",
    ]) {
      const result = await requestJson(path, {
        method: "POST",
        body: { secret: "private" },
      });
      assert.equal(result.ok, false, path);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

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

test("custom idempotency header survives refresh while CSRF cannot be overridden", () =>
  withFetch(
    () => new Response("{}"),
    async (calls) => {
      await requestJson("/api/x", {
        method: "POST",
        body: { answer: 1 },
        headers: new Headers({
          "Idempotency-Key": "stable-key",
          "X-XSRF-TOKEN": "injected",
        }),
      });
      const headers = new Headers(calls[0].init?.headers);
      assert.equal(headers.get("Idempotency-Key"), "stable-key");
      assert.equal(headers.get("X-XSRF-TOKEN"), "test-csrf");
      assert.equal(calls[0].init?.credentials, "same-origin");
      assert.equal(calls[0].init?.cache, "no-store");
    }
  ));

test("bodyless mutations do not send a JSON content type", () =>
  withFetch(
    () => new Response(null, { status: 204 }),
    async (calls) => {
      await requestJson("/api/x", { method: "DELETE" });
      assert.equal(
        new Headers(calls[0].init?.headers).has("Content-Type"),
        false
      );
    }
  ));

test("API requests have a deadline and propagate caller cancellation", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let requestSignal: AbortSignal | undefined;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  globalThis.fetch = async (_input, init) => {
    requestSignal = init?.signal ?? undefined;
    started();
    return new Promise<Response>((_resolve, reject) =>
      requestSignal?.addEventListener(
        "abort",
        () => reject(requestSignal?.reason),
        { once: true }
      )
    );
  };
  try {
    const pending = requestJson("/api/v1/dashboard", {
      signal: controller.signal,
    });
    await ready;
    assert.ok(requestSignal);
    assert.notEqual(
      requestSignal,
      controller.signal,
      "a caller signal must not remove the transport deadline"
    );
    controller.abort();
    const result = await pending;
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "network");
  } finally {
    controller.abort();
    globalThis.fetch = originalFetch;
  }
});

test("invalid DTO JSON is a service failure rather than successful data", () =>
  withFetch(
    () => new Response("{}"),
    async () => {
      const result = await requestJson<{ items: unknown[] }>("/api/x", {
        validate: (data) =>
          typeof data === "object" &&
          data !== null &&
          Array.isArray((data as { items?: unknown }).items),
      });
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.problem?.code, "INVALID_RESPONSE");
    }
  ));

test("malformed problem errors never escape into user field handling", () =>
  withFetch(
    () =>
      new Response('{"errors":"oops","detail":{"internal":"secret"}}', {
        status: 400,
      }),
    async () => {
      const result = await requestJson("/api/x");
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.problem?.detail, undefined);
        assert.deepEqual(result.problem?.errors, undefined);
      }
    }
  ));
