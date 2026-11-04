import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/[[path]].ts";

const originalFetch = globalThis.fetch;
const origin = "https://master.example.test";
const env = { BACKEND_URL: "https://api.example.test" };
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Pages proxy forwards auth body, cookies, CSRF, origin and query without caching", async () => {
  const body = JSON.stringify({
    email: "learner@example.test",
    password: "fixture only",
  });
  globalThis.fetch = async (url, init) => {
    assert.equal(
      String(url),
      "https://api.example.test/api/v1/auth/login?mode=test"
    );
    assert.equal(init?.method, "POST");
    assert.equal(new TextDecoder().decode(init?.body as ArrayBuffer), body);
    assert.equal(init?.redirect, "manual");
    assert.equal(init?.cache, "no-store");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Origin"), origin);
    assert.equal(headers.get("Cookie"), "XSRF-TOKEN=fixture");
    assert.equal(headers.get("X-XSRF-TOKEN"), "fixture");
    assert.equal(headers.get("X-Forwarded-For"), null);
    assert.equal(headers.get("Forwarded"), null);
    assert.equal(headers.get("Host"), null);
    assert.equal(headers.get("X-Forwarded-Proto"), "https");
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
      "CDN-Cache-Control": "public, max-age=3600",
    });
    responseHeaders.append(
      "Set-Cookie",
      "access_token=one; Path=/; HttpOnly; Secure; SameSite=Lax"
    );
    responseHeaders.append(
      "Set-Cookie",
      "refresh_token=two; Path=/api/v1/auth; Expires=Wed, 01 Jan 2031 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax"
    );
    responseHeaders.append(
      "Set-Cookie",
      "XSRF-TOKEN=three; Path=/; Secure; SameSite=Lax"
    );
    return new Response('{"ok":true}', { headers: responseHeaders });
  };
  const response = await onRequest({
    env,
    request: new Request(origin + "/api/v1/auth/login?mode=test", {
      method: "POST",
      body,
      headers: {
        Origin: origin,
        Cookie: "XSRF-TOKEN=fixture",
        "X-XSRF-TOKEN": "fixture",
        Host: "injected.test",
        Forwarded: "host=evil.test",
        "X-Forwarded-For": "spoofed",
      },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("CDN-Cache-Control"), null);
  assert.equal(response.headers.getSetCookie().length, 3);
  assert.match(response.headers.getSetCookie()[1], /Expires=Wed, 01 Jan 2031/);
  assert.deepEqual(await response.json(), { ok: true });
});

test("Pages proxy keeps 401 and quota responses including Retry-After", async () => {
  for (const status of [401, 403, 429]) {
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.body, undefined);
      return new Response('{"detail":"rejected"}', {
        status,
        headers: { "Retry-After": "60" },
      });
    };
    const response = await onRequest({
      env,
      request: new Request(origin + "/api/v1/users/me"),
    });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
});

test("Pages proxy fails closed for missing, insecure, path-based or recursive backend URLs", async () => {
  globalThis.fetch = async () => {
    throw new Error("Must not fetch");
  };
  for (const BACKEND_URL of [
    undefined,
    "http://api.example.test",
    "https://user:password@api.example.test",
    "https://api.example.test/api",
    "https://api.example.test/?x=1",
    origin,
  ]) {
    const response = await onRequest({
      env: { BACKEND_URL },
      request: new Request(origin + "/api/v1/auth/csrf"),
    });
    assert.equal(response.status, 503);
  }
});

test("Pages proxy cannot switch its configured host using a crafted path", async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(String(url)).origin, env.BACKEND_URL);
    return new Response("ok");
  };
  assert.equal(
    (
      await onRequest({
        env,
        request: new Request(origin + "/api//evil.test/anything"),
      })
    ).status,
    200
  );
  assert.equal(
    (await onRequest({ env, request: new Request(origin + "/outside") }))
      .status,
    404
  );
});

test("Pages proxy never follows upstream redirects and maps API-origin locations back to the frontend", async () => {
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.redirect, "manual");
    return new Response(null, {
      status: 307,
      headers: { Location: env.BACKEND_URL + "/api/other?x=1" },
    });
  };
  const response = await onRequest({
    env,
    request: new Request(origin + "/api/old"),
  });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("Location"), origin + "/api/other?x=1");
});

test("Pages proxy returns a generic failure without leaking upstream details", async () => {
  globalThis.fetch = async () => {
    throw new Error("internal credential detail");
  };
  const response = await onRequest({
    env,
    request: new Request(origin + "/api/v1/auth/csrf"),
  });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(await response.text(), /credential|api\.example/);
});
