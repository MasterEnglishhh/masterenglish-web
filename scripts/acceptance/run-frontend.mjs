import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const fixture = JSON.parse(
  readFileSync(".audit/runtime/backend/acceptance-credentials.json", "utf8")
);
assert.equal(fixture.baseUrl, "http://127.0.0.1:28081");
assert.match(fixture.notificationId, /^e9970000-0060-4000-8000-000000000001$/);
const inspection = spawnSync(
  "docker",
  ["inspect", "masterenglish-audit-9975"],
  { encoding: "utf8" }
);
assert.equal(
  inspection.status,
  0,
  "Docker audit container must be inspectable"
);
const container = JSON.parse(inspection.stdout)[0];
assert.equal(container.Config.Labels["masterenglish.audit"], "9975");
assert.equal(
  container.HostConfig.PortBindings["5432/tcp"][0].HostPort,
  "25433"
);

let failed = false;
for (const project of ["wide", "narrow"]) {
  // Mỗi viewport bắt đầu cùng trạng thái chưa đọc, không phụ thuộc lần chạy trước.
  const reset = spawnSync(
    "docker",
    [
      "exec",
      "masterenglish-audit-9975",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "audit",
      "-d",
      "masterenglish_audit",
      "-c",
      `UPDATE notifications SET read_at=NULL WHERE id='${fixture.notificationId}';`,
    ],
    { encoding: "utf8" }
  );
  assert.equal(
    reset.status,
    0,
    "Reset of the dedicated synthetic notification must succeed"
  );
  const result = spawnSync(
    process.execPath,
    [
      require.resolve("@playwright/test/cli"),
      "test",
      "--config=playwright.real.config.ts",
      `--project=${project}`,
    ],
    { stdio: "inherit", env: process.env }
  );
  if (result.error) throw result.error;
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
