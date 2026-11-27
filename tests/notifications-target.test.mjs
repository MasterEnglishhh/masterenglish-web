import test from "node:test";
import assert from "node:assert/strict";
import { loadHook } from "./helpers/load-hook.mjs";

const normalizeNotificationTarget = loadHook(
  "src/features/notifications/lib/notification-target.ts",
  "normalizeNotificationTarget",
  {
    getSafeRedirectUrl: loadHook(
      "src/features/auth/lib/redirect.ts",
      "getSafeRedirectUrl"
    ),
    isUuid: loadHook("src/lib/api-validation.ts", "isUuid"),
  }
);
const id = "e9970000-0001-4000-8000-000000000001";
test("notification targets map real backend legacy paths to existing learner routes", () => {
  assert.equal(
    normalizeNotificationTarget(`/grammar/topics/${id}`),
    `/learn/grammar?topic=${id}`
  );
  assert.equal(
    normalizeNotificationTarget("/vocabulary/review"),
    "/learn/review"
  );
  assert.equal(normalizeNotificationTarget("/dashboard"), "/learn");
  assert.equal(
    normalizeNotificationTarget(`/learn/vocabulary?deck=${id}`),
    `/learn/vocabulary?deck=${id}`
  );
  assert.equal(normalizeNotificationTarget("/learn/review"), "/learn/review");
});
test("unsafe, unsupported and malformed notification targets never render navigation", () => {
  for (const target of [
    null,
    "",
    "//evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/api/v1/users/me",
    "/learn/unknown",
    "/learn/ai-tutor",
    "/grammar/topics/invalid",
    "/learn/../admin",
    "/learn/\\evil.example",
  ])
    assert.equal(normalizeNotificationTarget(target), null, String(target));
});
