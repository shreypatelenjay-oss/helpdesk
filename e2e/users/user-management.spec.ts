import { test, expect } from "@playwright/test";
import path from "path";

const adminAuthFile = path.resolve(__dirname, "../.auth/admin.json");

test.describe("User management (admin)", () => {
  test.use({ storageState: adminAuthFile });

  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    // Wait for the skeleton to resolve and real table rows to appear
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Read — table renders with at least the seeded admin row
  // ---------------------------------------------------------------------------

  test("displays the users table with at least one row", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    const rowCount = await page.locator("tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Create — fill dialog, submit, new row appears in table
  // ---------------------------------------------------------------------------

  test("creates a new agent user and shows them in the table", async ({ page }) => {
    const unique = Date.now();
    const name = `Test Agent ${unique}`;
    const email = `agent-${unique}@test.local`;

    await page.getByRole("button", { name: "Add user" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "New user" })).toBeVisible();

    // Scope label queries to the dialog to avoid matching any other page labels
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Password").fill("AgentPass123!");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users") && r.request().method() === "POST"
      ),
      dialog.getByRole("button", { name: "Create user" }).click(),
    ]);

    expect(response.status()).toBe(201);

    // Dialog closes after success
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // New user row appears in the table
    await expect(page.getByRole("cell", { name })).toBeVisible();
    await expect(page.getByRole("cell", { name: email })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Update — seed a user via API, open their edit dialog, change name, verify
  // ---------------------------------------------------------------------------

  test("edits an existing agent user and shows the updated name", async ({ page }) => {
    const unique = Date.now();
    const originalName = `Edit Target ${unique}`;
    const updatedName = `Edited Agent ${unique}`;
    const email = `edit-target-${unique}@test.local`;

    // page.context().request shares the browser session cookies automatically
    const createRes = await page.context().request.post("http://localhost:8000/api/users", {
      data: { name: originalName, email, password: "AgentPass123!", role: "AGENT" },
    });
    expect(createRes.status()).toBe(201);

    // Reload so the freshly-created user appears
    await page.reload();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("cell", { name: originalName })).toBeVisible();

    const row = page.locator("tbody tr").filter({ hasText: email });
    await row.getByRole("button", { name: "Edit user" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Edit user" })).toBeVisible();

    // EditUserModal uses id="edit-name" — getByLabel("Name") still resolves via label text
    const nameInput = dialog.getByLabel("Name");
    await nameInput.clear();
    await nameInput.fill(updatedName);

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users/") && r.request().method() === "PATCH"
      ),
      dialog.getByRole("button", { name: "Save changes" }).click(),
    ]);

    expect(response.status()).toBe(200);

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Updated name visible; original name gone
    await expect(page.getByRole("cell", { name: updatedName })).toBeVisible();
    await expect(page.getByRole("cell", { name: originalName })).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Delete — seed a user via API, delete them in UI, verify row removed
  // ---------------------------------------------------------------------------

  test("deletes an agent user and removes them from the table", async ({ page }) => {
    const unique = Date.now();
    const name = `Delete Target ${unique}`;
    const email = `delete-target-${unique}@test.local`;

    const createRes = await page.context().request.post("http://localhost:8000/api/users", {
      data: { name, email, password: "AgentPass123!", role: "AGENT" },
    });
    expect(createRes.status()).toBe(201);

    await page.reload();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("cell", { name })).toBeVisible();

    const row = page.locator("tbody tr").filter({ hasText: email });
    await row.getByRole("button", { name: "Delete user" }).click();

    // AlertDialog confirmation appears with the user's name in the title
    const alertDialog = page.getByRole("alertdialog");
    await expect(alertDialog).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/users/") && r.request().method() === "DELETE"
      ),
      alertDialog.getByRole("button", { name: "Delete" }).click(),
    ]);

    // Server returns 204 No Content on successful delete
    expect(response.status()).toBe(204);

    // Row is removed from the table
    await expect(page.getByRole("cell", { name })).not.toBeVisible({ timeout: 5_000 });
  });
});
