import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockAdminUsers } from "../src/features/admin/data/mock-admin-users.ts";
import { mockAdminContent } from "../src/features/admin/data/mock-admin-content.ts";
import { mockFeatureFlags } from "../src/features/admin/data/mock-admin-system.ts";

describe("Admin Data Integrity & Contracts", () => {
  it("includes at least one SYSTEM_ADMIN and one CONTENT_ADMIN in seed", () => {
    const systemAdmins = mockAdminUsers.filter((u) => u.roles.includes("SYSTEM_ADMIN"));
    const contentAdmins = mockAdminUsers.filter((u) => u.roles.includes("CONTENT_ADMIN"));
    assert.ok(systemAdmins.length >= 1, "Must have system admins");
    assert.ok(contentAdmins.length >= 1, "Must have content admins");
  });

  it("has valid content items across required modules", () => {
    const modules = new Set(mockAdminContent.map((c) => c.module));
    assert.ok(modules.has("VOCABULARY"), "Must have VOCABULARY");
    assert.ok(modules.has("GRAMMAR"), "Must have GRAMMAR");
    assert.ok(modules.has("TOEIC"), "Must have TOEIC");
  });

  it("feature flags seed has non-empty keys and names", () => {
    for (const flag of mockFeatureFlags) {
      assert.ok(flag.key.startsWith("FLAG_"), `Flag key must start with FLAG_: ${flag.key}`);
      assert.ok(flag.name.length > 0, "Flag name must not be empty");
    }
  });
});
