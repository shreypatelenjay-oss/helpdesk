import { test, expect } from "@playwright/test";
import path from "path";

// ---------------------------------------------------------------------------
// UNAUTHENTICATED USERS — no storageState loaded
// ---------------------------------------------------------------------------

test.describe("Unauthenticated access", () => {
  test("visiting / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("visiting /users redirects to /login", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("visiting an unknown route redirects to / which then redirects to /login", async ({
    page,
  }) => {
    await page.goto("/some/unknown/path");
    // App has a catch-all <Navigate to="/" />, so the chain is:
    // unknown → / → /login (because ProtectedRoute kicks in)
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("login page is accessible without authentication", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("button", { name: "Sign in" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AUTHENTICATED ADMIN — storageState loaded from auth setup
// ---------------------------------------------------------------------------

test.describe("Authenticated admin access", () => {
  test.use({
    storageState: path.resolve(__dirname, "../.auth/admin.json"),
  });

  test("/ is accessible and shows the navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("button", { name: "Sign out" })
    ).toBeVisible();
  });

  test("/users is accessible for admin", async ({ page }) => {
    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/login/);
    // AdminRoute allows ADMIN role through; just verify we didn't get bounced.
    await expect(page).toHaveURL(/\/users/);
  });

  test("navbar shows Users link for admin", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Users" })
    ).toBeVisible();
  });

  test("navbar displays the logged-in user's email or name", async ({
    page,
  }) => {
    await page.goto("/");
    // Navbar renders session.user.name ?? session.user.email
    await expect(page.getByText(/admin@test\.local/i).or(page.getByText(/admin/i))).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// SESSION PERSISTENCE — reload while authenticated
// ---------------------------------------------------------------------------

test.describe("Session persistence", () => {
  test.use({
    storageState: path.resolve(__dirname, "../.auth/admin.json"),
  });

  test("reloading the page keeps the user logged in", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);

    await page.reload();

    // After reload the session should still be valid — not bounced to /login.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "Sign out" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// SIGN-OUT FLOW
// ---------------------------------------------------------------------------

// Helper: log in fresh through the UI (used by sign-out tests so each test
// starts with its own server-side session rather than sharing admin.json,
// which would be invalidated after the first sign-out call).
async function loginAsFreshAdmin(page: any) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@test.local");
  await page.getByLabel("Password").fill("TestAdminPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
}

test.describe("Sign-out", () => {
  test("signing out redirects to /login", async ({ page }) => {
    await loginAsFreshAdmin(page);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    const [, response] = await Promise.all([
      page.getByRole("button", { name: "Sign out" }).click(),
      page.waitForResponse((r) =>
        r.url().includes("/api/auth/sign-out") && r.request().method() === "POST"
      ),
    ]);

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("after sign-out, protected routes redirect back to /login", async ({
    page,
  }) => {
    await loginAsFreshAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("after sign-out, the sign-out button is no longer visible on /login", async ({
    page,
  }) => {
    await loginAsFreshAdmin(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await expect(
      page.getByRole("button", { name: "Sign out" })
    ).not.toBeVisible();
  });
});
