import { test, expect } from "@playwright/test";
import path from "path";
import { postWebhook } from "./helpers/api";

const adminAuthFile = path.resolve(__dirname, ".auth/admin.json");

// ---------------------------------------------------------------------------
// Unauthenticated redirect
// ---------------------------------------------------------------------------

test("redirects unauthenticated users from /tickets/:id to /login", async ({ page }) => {
  // Use a plausible-looking ticket ID — the redirect should happen before
  // the server is ever queried because the client-side auth guard fires first.
  await page.goto("/tickets/abc123");
  await expect(page).toHaveURL(/\/login/);
});

// ---------------------------------------------------------------------------
// Authenticated flows
// ---------------------------------------------------------------------------

test.describe("Ticket detail page (authenticated)", () => {
  test.use({ storageState: adminAuthFile });

  test("sends a reply and it appears in the reply thread", async ({ page }) => {
    const unique = Date.now();
    const subject = `E2E reply test ${unique}`;
    const replyText = `This is an e2e reply ${unique}`;

    await postWebhook(page.request, {
      from: `reply-user-${unique}@test.local`,
      subject,
      text: `Original ticket body ${unique}`,
    });

    await page.goto("/tickets");
    await page.getByRole("link", { name: subject }).click();
    await expect(page).toHaveURL(/\/tickets\/[a-z0-9]+/);

    // Fill and submit the reply form
    await page.getByTestId("reply-input").fill(replyText);

    const replyResponse = page.waitForResponse(
      (r) => r.url().includes("/reply") && r.request().method() === "POST"
    );
    await page.getByTestId("reply-submit").click();
    await replyResponse;

    // After the mutation succeeds the query is invalidated and the UI re-renders.
    // The reply thread should now contain our reply text.
    await expect(page.getByTestId("reply-thread")).toContainText(replyText);

    // The reply input should be cleared after a successful send
    await expect(page.getByTestId("reply-input")).toHaveValue("");
  });

  test("changes ticket status and the new status persists after a page reload", async ({ page }) => {
    const unique = Date.now();
    const subject = `E2E status update ${unique}`;

    await postWebhook(page.request, {
      from: `status-user-${unique}@test.local`,
      subject,
      text: `Status update body ${unique}`,
    });

    await page.goto("/tickets");
    await page.getByRole("link", { name: subject }).click();
    await expect(page).toHaveURL(/\/tickets\/[a-z0-9]+/);

    const statusSelect = page.locator("#ticket-status-select");
    await expect(statusSelect).toHaveValue("OPEN");

    // Change status to RESOLVED via the PATCH endpoint
    const patchResponse = page.waitForResponse(
      (r) => /\/api\/tickets\/[a-z0-9]+$/.test(r.url()) && r.request().method() === "PATCH"
    );
    await statusSelect.selectOption("RESOLVED");
    await patchResponse;

    // Reload and confirm the server persisted the new status
    await page.reload();
    await expect(page.locator("#ticket-status-select")).toHaveValue("RESOLVED");
  });
});
