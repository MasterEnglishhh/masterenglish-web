import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Pages and standalone apply the same document security policy", async () => {
  assert.ok(existsSync("public/_headers"), "Pages security headers must be shipped");
  process.env.BACKEND_URL = "http://127.0.0.1:8080";
  const { default: config } = await import("../next.config.ts");
  assert.ok(config.headers);
  const rules = await config.headers();
  const policy = rules.find((rule) => rule.source === "/:path*");
  assert.ok(policy);
  const pages = readFileSync("public/_headers", "utf8");
  for (const [key, value] of Object.entries({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  })) {
    assert.ok(policy.headers.some((header) => header.key === key && header.value === value));
    assert.ok(pages.includes(`${key}: ${value}`));
  }
});
