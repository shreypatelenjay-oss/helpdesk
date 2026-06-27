import { test, expect } from "@playwright/test";

test("redirects unauthenticated users from /tickets to /login", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page).toHaveURL(/\/login/);
});
