import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "server/.env.test") });

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",
  reporter: [["html", { outputFolder: "./e2e/playwright-report", open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // -----------------------------------------------------------------------
    // 1. Auth setup — runs once before all other projects.
    //    Logs in as admin and saves session state to e2e/.auth/admin.json.
    // -----------------------------------------------------------------------
    {
      name: "setup",
      testMatch: /setup\/auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // -----------------------------------------------------------------------
    // 2. All other tests run in Chromium with NO project-level storageState.
    //    Individual test.describe blocks that need auth load storageState via
    //    test.use({ storageState: '...' }) directly inside the describe block.
    //    Unauthenticated describe blocks get a bare browser automatically.
    // -----------------------------------------------------------------------
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /setup\/auth\.setup\.ts/,
    },
  ],

  webServer: [
    {
      command: "bun run src/index.ts",
      cwd: path.resolve(__dirname, "server"),
      url: "http://localhost:8000/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
        BASE_URL: process.env.BASE_URL!,
        TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS!,
        INBOUND_EMAIL_SECRET: process.env.INBOUND_EMAIL_SECRET!,
        NODE_ENV: "test",
      },
      timeout: 30_000,
    },
    {
      command: "bun run dev",
      cwd: path.resolve(__dirname, "client"),
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
