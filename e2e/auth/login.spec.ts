import { test, expect } from "@playwright/test";

// These tests intentionally run WITHOUT pre-loaded auth state so we can
// observe the login page itself and all failure branches.

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test("successful login with valid admin credentials redirects away from /login", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByLabel("Password").fill("TestAdminPass123!");

    // Capture the sign-in API response so we don't rely purely on navigation timing.
    const [, response] = await Promise.all([
      page.getByRole("button", { name: "Sign in" }).click(),
      page.waitForResponse((r) =>
        r.url().includes("/api/auth/sign-in") && r.request().method() === "POST"
      ),
    ]);

    expect(response.status()).toBe(200);

    // Should end up anywhere except /login.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("successful login shows the authenticated UI (navbar with sign-out button)", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByLabel("Password").fill("TestAdminPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Failure paths — wrong credentials
  // -------------------------------------------------------------------------

  test("shows error message when password is wrong", async ({ page }) => {
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByLabel("Password").fill("WrongPassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // The server-error alert rendered by the Alert component should appear.
    await expect(
      page.getByRole("alert").or(page.locator("[role=alert]"))
    ).toBeVisible({ timeout: 8_000 });

    // We must remain on /login.
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error message for non-existent email", async ({ page }) => {
    await page.getByLabel("Email").fill("nobody@test.local");
    await page.getByLabel("Password").fill("TestAdminPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("alert").or(page.locator("[role=alert]"))
    ).toBeVisible({ timeout: 8_000 });

    await expect(page).toHaveURL(/\/login/);
  });

  // -------------------------------------------------------------------------
  // Client-side validation — empty fields
  // -------------------------------------------------------------------------

  test("shows validation error when both fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in" }).click();

    // react-hook-form + zod will render inline validation messages.
    // "Enter a valid email" for email, "Password is required" for password.
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();

    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error when only email is missing", async ({ page }) => {
    await page.getByLabel("Password").fill("TestAdminPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error when email format is invalid", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("TestAdminPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error when only password is missing", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // -------------------------------------------------------------------------
  // Sign-up is disabled — no sign-up link should exist
  // -------------------------------------------------------------------------

  test("login page does not offer a sign-up option", async ({ page }) => {
    // The app has sign-up disabled; there should be no link/button for it.
    await expect(
      page.getByRole("link", { name: /sign.?up|register|create account/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /sign.?up|register/i })
    ).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // Already-logged-in redirect
  // -------------------------------------------------------------------------

  test("already logged-in user visiting /login is redirected away", async ({
    page,
    context,
  }) => {
    // Log in first via UI.
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByLabel("Password").fill("TestAdminPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

    // Now navigate back to /login — LoginPage has `if (session) return <Navigate to="/" />`.
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
