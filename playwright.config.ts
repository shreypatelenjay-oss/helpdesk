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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "bun run src/index.ts",
      cwd: path.resolve(__dirname, "server"),
      url: "http://localhost:8000/api/health",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
        BASE_URL: process.env.BASE_URL!,
        TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS!,
        NODE_ENV: "test",
      },
      timeout: 30_000,
    },
    {
      command: "bun run dev",
      cwd: path.resolve(__dirname, "client"),
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
