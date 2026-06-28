import { test, expect } from "@playwright/test";
import path from "path";
import { postWebhook } from "../helpers/api";

const adminAuthFile = path.resolve(__dirname, "../.auth/admin.json");

test("redirects unauthenticated users from /tickets to /login", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("Tickets list and filtering", () => {
  test.use({ storageState: adminAuthFile });

  test.beforeEach(async ({ page }) => {
    // Seed some test tickets first
    const unique = Date.now();
    await Promise.all([
      postWebhook(page.request, {
        from: `user-open-${unique}@test.local`,
        subject: `Open issue query ${unique}`,
        text: "Please resolve this open ticket",
      }),
      postWebhook(page.request, {
        from: `user-refund-${unique}@test.local`,
        subject: `Refund request query ${unique}`,
        text: "I want a refund for the product",
      }),
    ]);
  });

  test("displays tickets and allows search and filtering", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    // 1. Search Query filtering
    const searchInput = page.getByPlaceholder("Search subject, body or sender...");
    await searchInput.fill("Refund request");
    
    // The open ticket should disappear, and only the refund ticket should be visible
    await expect(page.locator("tbody")).toContainText("Refund request");
    await expect(page.locator("tbody")).not.toContainText("Open issue");

    // 2. Clear search via X button
    await page.getByLabel("Clear search").click();
    await expect(searchInput).toHaveValue("");

    // 3. Status filtering
    const statusSelect = page.getByRole("combobox", { name: "Filter by Status" });
    // Since our seeded tickets are OPEN by default, let's filter by CLOSED
    await statusSelect.selectOption("CLOSED");
    
    // It should display empty state matching filter
    await expect(page.getByText("No tickets match the selected filters.")).toBeVisible();

    // Reset filters
    await page.getByRole("button", { name: /Reset/ }).click();
    await expect(statusSelect).toHaveValue("ALL");
  });

  test("supports pagination", async ({ page }) => {
    // Seed 10 additional tickets (2 are already seeded in beforeEach, making 12 total)
    const unique = Date.now();
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        postWebhook(page.request, {
          from: `paginated-user-${i}-${unique}@test.local`,
          subject: `Paginated ticket subject ${i} ${unique}`,
          text: `Body text for ticket number ${i}`,
        })
      );
    }
    await Promise.all(promises);

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    // Verify first page pagination info
    await expect(page.locator("text=Showing 1 to 10 of")).toBeVisible();

    // Click next page button
    await page.getByLabel("Next page").click();

    // Verify second page pagination info
    await expect(page.locator("text=Showing 11 to")).toBeVisible();

    // Click previous page button
    await page.getByLabel("Previous page").click();

    // Verify we are back to first page
    await expect(page.locator("text=Showing 1 to 10 of")).toBeVisible();
  });

  test("clicking ticket subject navigates to detail page and allows updating properties", async ({ page }) => {
    const unique = Date.now();
    const subject = `Detail test query ${unique}`;
    
    // Seed one ticket
    await postWebhook(page.request, {
      from: `detail-sender-${unique}@test.local`,
      subject: subject,
      text: `Detailed issue explanation text ${unique}`,
    });

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    // Click the subject link
    await page.getByRole("link", { name: subject }).click();

    // Assert that URL path is /tickets/<id>
    await expect(page).toHaveURL(/\/tickets\/c[a-z0-9]+/);

    // Verify detail page elements
    await expect(page.getByRole("heading", { name: subject })).toBeVisible();
    await expect(page.getByText(`Detailed issue explanation text ${unique}`)).toBeVisible();
    await expect(page.getByText(`detail-sender-${unique}@test.local`)).toBeVisible();

    // Verify initial values on selects
    const statusSelect = page.locator("#ticket-status-select");
    await expect(statusSelect).toHaveValue("OPEN");

    const categorySelect = page.locator("#ticket-category-select");
    await expect(categorySelect).toHaveValue("UNASSIGNED");

    // Change category to TECHNICAL_QUESTION
    await categorySelect.selectOption("TECHNICAL_QUESTION");

    // Click back to tickets
    await page.getByRole("button", { name: /Back to Tickets/i }).click();
    await expect(page).toHaveURL(/\/tickets/);

    // Filter by category TECHNICAL_QUESTION
    const categoryFilter = page.getByRole("combobox", { name: "Filter by Category" });
    await categoryFilter.selectOption("TECHNICAL_QUESTION");

    // Verify the ticket is shown under Technical filter
    await expect(page.locator("tbody")).toContainText(subject);
  });
});
