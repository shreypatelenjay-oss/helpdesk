import { test as setup, expect } from "@playwright/test";
import path from "path";

const adminAuthFile = path.resolve(__dirname, "../.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@test.local");
  await page.getByLabel("Password").fill("TestAdminPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait until we're off the login page — better-auth sets the session cookie
  // after the redirect, so we wait for navigation rather than a specific element.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  // Persist the browser storage state (cookies + localStorage) for reuse.
  await page.context().storageState({ path: adminAuthFile });
});
