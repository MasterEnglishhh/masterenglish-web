import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  fetchCsrfToken,
  login,
  getCurrentUser,
  logout,
  refreshSession,
} from "./auth-client.ts";

const originalFetch = globalThis.fetch;
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  "document"
);
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalDocument)
    Object.defineProperty(globalThis, "document", originalDocument);
  else Reflect.deleteProperty(globalThis, "document");
});

const profile = {
  id: "4ab6bf70-7610-4da4-a172-67e0620eb869",
  email: "learner@example.com",
  displayName: "Học viên A",
  firstName: "A",
  lastName: "Nguyễn",
  roles: ["LEARNER"],
  phone: null,
  avatarMediaId: null,
};
const credentials = { email: "learner@example.com", password: "Password123!" };
const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), { status, headers });
const csrf = () => json({ headerName: "X-XSRF-TOKEN", token: "csrf-token" });

test("CSRF bootstrap uses same-origin cookies and disables caching", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/api/v1/auth/csrf");
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    return csrf();
  };
  assert.deepEqual(await fetchCsrfToken(), {
    headerName: "X-XSRF-TOKEN",
    token: "csrf-token",
  });
});

test("login matches backend profile contract, normalizes email and preserves password", async () => {
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    assert.equal(input, "/api/v1/auth/login");
    assert.equal(init?.method, "POST");
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    assert.equal(new Headers(init?.headers).get("X-XSRF-TOKEN"), "csrf-token");
    assert.deepEqual(JSON.parse(init?.body as string), {
      email: "learner@example.com",
      password: "  Secret!  ",
    });
    return json(profile);
  };
  assert.deepEqual(
    await login({ email: " Learner@Example.com ", password: "  Secret!  " }),
    { success: true, user: profile }
  );
});

test("failed CSRF bootstrap never posts credentials", async () => {
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    assert.equal(input, "/api/v1/auth/csrf");
    return new Response(null, { status: 503 });
  };
  const result = await login(credentials);
  assert.equal(result.success, false);
  assert.equal(calls, 1);
});

test("CSRF renewal uses the final browser cookie instead of an older body token", async () => {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { cookie: "other=value; XSRF-TOKEN=renewed-cookie-token" },
  });
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    assert.equal(
      new Headers(init?.headers).get("X-XSRF-TOKEN"),
      "renewed-cookie-token"
    );
    return json(profile);
  };
  assert.equal((await login(credentials)).success, true);
});

test("login reports network failure without throwing", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.code, "NETWORK_ERROR");
});

test("backend UNAUTHENTICATED login error maps to generic bad credentials", async () => {
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : json(
          {
            code: "UNAUTHENTICATED",
            detail: "Email hoặc mật khẩu không chính xác",
          },
          401
        );
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, "BAD_CREDENTIALS");
    assert.equal(result.error.status, 401);
  }
});

test("rate limiting respects Retry-After and shows a Vietnamese message", async () => {
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : json({ code: "RATE_LIMITED", detail: "Too many login attempts" }, 429, {
          "Retry-After": "30",
        });
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.retryAfterSeconds, 30);
    assert.match(result.error.message, /30 giây/);
  }
});

test("validation errors map backend field violations", async () => {
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : json(
          {
            code: "VALIDATION_ERROR",
            errors: [{ field: "email", message: "Invalid email format" }],
          },
          400
        );
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.code, "VALIDATION_ERROR");
    assert.deepEqual(result.error.fieldViolations, {
      email: "Vui lòng nhập email hợp lệ.",
    });
  }
});

test("login bootstraps a fresh CSRF token after 403 and retries only once", async () => {
  let bootstraps = 0;
  let posts = 0;
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf")
      return json({
        headerName: "X-XSRF-TOKEN",
        token: `token-${++bootstraps}`,
      });
    posts++;
    assert.equal(
      new Headers(init?.headers).get("X-XSRF-TOKEN"),
      `token-${posts}`
    );
    return posts === 1 ? new Response(null, { status: 403 }) : json(profile);
  };
  assert.equal((await login(credentials)).success, true);
  assert.equal(posts, 2);
  assert.equal(bootstraps, 2);
});

test("persistent CSRF rejection is bounded", async () => {
  let posts = 0;
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    posts++;
    return new Response(null, { status: 403 });
  };
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.code, "FORBIDDEN");
  assert.equal(posts, 2);
});

test("HTML service error does not leak into the login UI", async () => {
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : new Response("<html>Bad gateway</html>", { status: 502 });
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.code, "SERVICE_UNAVAILABLE");
});

test("login without a verifiable profile fails instead of creating a fake user", async () => {
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/auth/login")
      return new Response(null, { status: 200 });
    return new Response(null, { status: 401 });
  };
  const result = await login(credentials);
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.code, "SESSION_UNAVAILABLE");
});

test("current user is read directly when the access cookie is valid", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/api/v1/users/me");
    assert.equal(init?.cache, "no-store");
    return json(profile);
  };
  assert.deepEqual(await getCurrentUser(), profile);
});

test("expired access cookie refreshes with CSRF then retries profile", async () => {
  const calls: string[] = [];
  let refreshed = false;
  globalThis.fetch = async (input, init) => {
    calls.push(String(input));
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/auth/refresh") {
      assert.equal(init?.method, "POST");
      assert.equal(
        new Headers(init?.headers).get("X-XSRF-TOKEN"),
        "csrf-token"
      );
      refreshed = true;
      return json({ message: "Phiên làm việc đã được làm mới thành công." });
    }
    return refreshed ? json(profile) : new Response(null, { status: 401 });
  };
  assert.deepEqual(await getCurrentUser(), profile);
  assert.deepEqual(calls, [
    "/api/v1/users/me",
    ...(navigator.locks ? ["/api/v1/users/me"] : []),
    "/api/v1/auth/csrf",
    "/api/v1/auth/refresh",
    "/api/v1/users/me",
  ]);
});

test("concurrent profile reads rotate a refresh token only once", async () => {
  let rotations = 0;
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/auth/refresh") {
      rotations++;
      return json({ message: "ok" });
    }
    return rotations ? json(profile) : new Response(null, { status: 401 });
  };
  const users = await Promise.all([
    getCurrentUser(),
    getCurrentUser(),
    getCurrentUser(),
  ]);
  assert.deepEqual(users, [profile, profile, profile]);
  assert.equal(rotations, 1);
});

test("concurrent refresh calls share one request", async () => {
  let rotations = 0;
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/users/me")
      return new Response(null, { status: 401 });
    rotations++;
    return json({ message: "ok" });
  };
  assert.deepEqual(await Promise.all([refreshSession(), refreshSession()]), [
    true,
    true,
  ]);
  assert.equal(rotations, 1);
});

test("expired refresh session returns null without looping", async () => {
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    return input === "/api/v1/auth/csrf"
      ? csrf()
      : new Response(null, { status: 401 });
  };
  assert.equal(await getCurrentUser(), null);
  assert.equal(calls, navigator.locks ? 4 : 3);
});

test("profile 401 after a successful refresh does not refresh repeatedly", async () => {
  let rotations = 0;
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/auth/refresh") {
      rotations++;
      return json({ message: "ok" });
    }
    return new Response(null, { status: 401 });
  };
  assert.equal(await getCurrentUser(), null);
  assert.equal(rotations, 1);
});

test("network and server outages are not treated as signed out", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("offline");
  };
  await assert.rejects(getCurrentUser(), /offline/);
  globalThis.fetch = async () => new Response(null, { status: 503 });
  await assert.rejects(getCurrentUser());
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : new Response(null, {
          status: input === "/api/v1/users/me" ? 401 : 503,
        });
  await assert.rejects(getCurrentUser());
});

test("logout includes CSRF and succeeds on backend 204", async () => {
  globalThis.fetch = async (input, init) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    assert.equal(input, "/api/v1/auth/logout");
    assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("X-XSRF-TOKEN"), "csrf-token");
    return new Response(null, { status: 204 });
  };
  assert.equal(await logout(), true);
});

test("logout failure is reported so UI retains the account", async () => {
  globalThis.fetch = async (input) =>
    input === "/api/v1/auth/csrf"
      ? csrf()
      : new Response(null, { status: 503 });
  assert.equal(await logout(), false);
});

test("logout waits for an in-flight refresh before revoking the session", async () => {
  const calls: string[] = [];
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async (input) => {
    if (input === "/api/v1/auth/csrf") return csrf();
    if (input === "/api/v1/users/me")
      return new Response(null, { status: 401 });
    if (input === "/api/v1/auth/refresh") {
      await pending;
      calls.push("refresh");
      return json({ message: "ok" });
    }
    calls.push("logout");
    return new Response(null, { status: 204 });
  };
  const refresh = refreshSession();
  const signOut = logout();
  release();
  await Promise.all([refresh, signOut]);
  assert.deepEqual(calls, ["refresh", "logout"]);
});
