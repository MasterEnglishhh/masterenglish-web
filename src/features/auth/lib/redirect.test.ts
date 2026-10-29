import test from "node:test";
import assert from "node:assert/strict";
import { getSafeRedirectUrl } from "./redirect.ts";

test("getSafeRedirectUrl - valid relative paths", () => {
  assert.equal(getSafeRedirectUrl("/learn"), "/learn");
  assert.equal(getSafeRedirectUrl("/learn/toeic"), "/learn/toeic");
  assert.equal(getSafeRedirectUrl("/learn/vocabulary?tab=flashcard"), "/learn/vocabulary?tab=flashcard");
});

test("getSafeRedirectUrl - invalid or missing inputs use fallback", () => {
  assert.equal(getSafeRedirectUrl(null), "/learn");
  assert.equal(getSafeRedirectUrl(undefined), "/learn");
  assert.equal(getSafeRedirectUrl(""), "/learn");
  assert.equal(getSafeRedirectUrl("   "), "/learn");
  assert.equal(getSafeRedirectUrl(null, "/learn/toeic"), "/learn/toeic");
});

test("getSafeRedirectUrl - blocks open-redirect attacks", () => {
  // Protocol-relative URLs
  assert.equal(getSafeRedirectUrl("//evil.com"), "/learn");
  assert.equal(getSafeRedirectUrl("//evil.com/phishing"), "/learn");

  // Absolute URLs
  assert.equal(getSafeRedirectUrl("https://evil.com"), "/learn");
  assert.equal(getSafeRedirectUrl("http://evil.com"), "/learn");
  assert.equal(getSafeRedirectUrl("javascript:alert(1)"), "/learn");

  // Backslash tricks
  assert.equal(getSafeRedirectUrl("/\\evil.com"), "/learn");
  assert.equal(getSafeRedirectUrl("/path\\with\\backslash"), "/learn");
});

test("getSafeRedirectUrl - blocks auth loop redirects", () => {
  assert.equal(getSafeRedirectUrl("/login"), "/learn");
  assert.equal(getSafeRedirectUrl("/login?redirect=/learn"), "/learn");
  assert.equal(getSafeRedirectUrl("/register"), "/learn");
  assert.equal(getSafeRedirectUrl("/register?ref=promo"), "/learn");
  assert.equal(getSafeRedirectUrl("/forgot-password"), "/learn");

  // Legacy paths
  assert.equal(getSafeRedirectUrl("/dang-nhap"), "/learn");
  assert.equal(getSafeRedirectUrl("/dang-ky"), "/learn");
  assert.equal(getSafeRedirectUrl("/quen-mat-khau"), "/learn");
});
