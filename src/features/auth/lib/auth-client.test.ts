import test from "node:test";
import assert from "node:assert/strict";
import { fetchCsrfToken, login, getCurrentUser, logout } from "./auth-client.ts";

const originalFetch = globalThis.fetch;

test("fetchCsrfToken - returns token from API", async () => {
  globalThis.fetch = async (input) => {
    assert.equal(input, "/api/v1/auth/csrf");
    return new Response(
      JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-token-123" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const res = await fetchCsrfToken();
  assert.deepEqual(res, { headerName: "X-XSRF-TOKEN", token: "csrf-token-123" });
  globalThis.fetch = originalFetch;
});

test("login - successful 200 returns user data", async () => {
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-token-123" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (input === "/api/v1/auth/login") {
      assert.equal(init?.method, "POST");
      assert.equal(
        (init?.headers as Record<string, string>)["X-XSRF-TOKEN"],
        "csrf-token-123"
      );
      return new Response(
        JSON.stringify({
          id: "usr_1",
          email: "learner@masterenglish.com",
          displayName: "Học viên A",
          role: "STUDENT",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    throw new Error(`Unexpected call: ${input}`);
  };

  const res = await login({
    email: "learner@masterenglish.com",
    password: "Password123!",
  });

  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.user.id, "usr_1");
    assert.equal(res.user.email, "learner@masterenglish.com");
  }

  globalThis.fetch = originalFetch;
});

test("login - does not create a user when the session cannot be confirmed", async () => {
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-token-123" }),
        { status: 200 }
      );
    }
    if (input === "/api/v1/auth/login") {
      return new Response(null, { status: 200 });
    }
    if (input === "/api/v1/users/me") {
      return new Response(null, { status: 401 });
    }
    throw new Error(`Unexpected call: ${input}`);
  };

  const result = await login({ email: "learner@example.com", password: "Password123!" });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, "SESSION_UNAVAILABLE");
  }

  globalThis.fetch = originalFetch;
});

test("login - 401 returns generic BAD_CREDENTIALS error", async () => {
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "token" }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        title: "Unauthorized",
        status: 401,
        code: "BAD_CREDENTIALS",
      }),
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  };

  const res = await login({
    email: "test@example.com",
    password: "wrong-password",
  });

  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, "BAD_CREDENTIALS");
    assert.equal(res.error.message, "Email hoặc mật khẩu không chính xác.");
    assert.equal(res.error.status, 401);
  }

  globalThis.fetch = originalFetch;
});

test("login - 429 returns RATE_LIMITED with retryAfterSeconds", async () => {
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "token" }),
        { status: 200 }
      );
    }
    return new Response(
      JSON.stringify({
        title: "Too Many Requests",
        status: 429,
        detail: "Quá nhiều lần thử sai. Vui lòng đợi 30 giây.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": "30",
        },
      }
    );
  };

  const res = await login({
    email: "test@example.com",
    password: "wrong-password",
  });

  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, "RATE_LIMITED");
    assert.equal(res.error.retryAfterSeconds, 30);
    assert.equal(res.error.status, 429);
  }

  globalThis.fetch = originalFetch;
});

test("login - 404 returns SERVICE_UNAVAILABLE when backend auth is pending", async () => {
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "token" }),
        { status: 200 }
      );
    }
    return new Response("Not Found", { status: 404 });
  };

  const res = await login({
    email: "test@example.com",
    password: "Password123!",
  });

  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, "SERVICE_UNAVAILABLE");
    assert.equal(res.error.retryable, true);
    assert.equal(res.error.status, 404);
  }

  globalThis.fetch = originalFetch;
});

test("login - network error returns NETWORK_ERROR with retryable true", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const res = await login({
    email: "test@example.com",
    password: "Password123!",
  });

  assert.equal(res.success, false);
  if (!res.success) {
    assert.equal(res.error.code, "NETWORK_ERROR");
    assert.equal(res.error.retryable, true);
  }

  globalThis.fetch = originalFetch;
});

test("getCurrentUser - returns user on 200 and null on 401", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ id: "usr_2", email: "user2@masterenglish.com" }),
      { status: 200 }
    );

  const user = await getCurrentUser();
  assert.equal(user?.id, "usr_2");

  globalThis.fetch = async () => new Response(null, { status: 401 });
  const anon = await getCurrentUser();
  assert.equal(anon, null);

  globalThis.fetch = originalFetch;
});

test("logout - sends CSRF and calls POST /api/v1/auth/logout", async () => {
  let logoutCalled = false;
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf") {
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-token-123" }),
        { status: 200 }
      );
    }
    if (input === "/api/v1/auth/logout") {
      logoutCalled = true;
      assert.equal(init?.method, "POST");
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected: ${input}`);
  };

  const success = await logout();
  assert.equal(success, true);
  assert.equal(logoutCalled, true);

  globalThis.fetch = originalFetch;
});
