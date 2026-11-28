import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "./e2e/real",
  testIgnore: [],
  outputDir: ".audit/evidence/e2e-real",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  webServer: undefined,
  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:3001",
    trace: "off",
  },
  projects: [
    { name: "wide", use: { viewport: { width: 1440, height: 900 } } },
    { name: "narrow", use: { viewport: { width: 360, height: 800 } } },
  ],
});
