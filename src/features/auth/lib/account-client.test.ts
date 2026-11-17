import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  changePassword,
  fetchLearningGoal,
  updateProfile,
} from "./account-client.ts";

function withFetch(
  handler: (url: string, init?: RequestInit) => Response,
  run: () => Promise<void>
) {
  const original = globalThis.fetch;
  globalThis.fetch = mock.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/csrf"))
      return new Response(
        JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "test-csrf" }),
        { status: 200 }
      );
    return handler(url, init);
  });
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test("profile update sends CSRF, trims input and maps an empty phone to null", () => {
  let sent: { headers?: HeadersInit; body?: BodyInit | null } = {};
  return withFetch(
    (url, init) => {
      sent = { headers: init?.headers, body: init?.body };
      return new Response(JSON.stringify({ id: "u1", email: "a@b.c" }), {
        status: 200,
      });
    },
    async () => {
      const result = await updateProfile({
        firstName: " An ",
        lastName: "Nguyen",
        phone: "  ",
      });
      assert.equal(result.success, true);
      assert.equal(
        (sent.headers as Record<string, string>)["X-XSRF-TOKEN"],
        "test-csrf"
      );
      assert.deepEqual(JSON.parse(String(sent.body)), {
        firstName: "An",
        lastName: "Nguyen",
        phone: null,
      });
    }
  );
});

test("change password surfaces the backend's Vietnamese reason and field errors", () =>
  withFetch(
    () =>
      new Response(
        JSON.stringify({
          code: "PASSWORD_REJECTED",
          detail: "Mật khẩu hiện tại không đúng.",
          errors: [{ field: "newPassword" }],
        }),
        { status: 400 }
      ),
    async () => {
      const result = await changePassword({
        currentPassword: "x",
        newPassword: "y",
      });
      assert.equal(result.success, false);
      if (result.success) return;
      assert.equal(result.error.message, "Mật khẩu hiện tại không đúng.");
      assert.ok(result.error.fieldErrors?.newPassword);
    }
  ));

test("a missing learning goal (404) is an empty state, not an error", () =>
  withFetch(
    () => new Response(JSON.stringify({ detail: "Chưa thiết lập" }), { status: 404 }),
    async () => {
      const result = await fetchLearningGoal();
      assert.deepEqual(result, { success: true, data: null });
    }
  ));

test("server errors never show raw backend details", () =>
  withFetch(
    () => new Response(JSON.stringify({ detail: "NullPointerException" }), { status: 500 }),
    async () => {
      const result = await fetchLearningGoal();
      assert.equal(result.success, false);
      if (result.success) return;
      assert.doesNotMatch(result.error.message, /NullPointer/);
    }
  ));
