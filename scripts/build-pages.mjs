import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const result = spawnSync(
  process.execPath,
  // Turbopack's CSS worker exits before connecting on this Windows toolchain.
  // Keep the Linux/Cloudflare build path unchanged; use the supported bundler locally.
  [
    require.resolve("next/dist/bin/next"),
    "build",
    ...(process.platform === "win32" ? ["--webpack"] : []),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, DEPLOY_TARGET: "cloudflare-pages" },
  }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
