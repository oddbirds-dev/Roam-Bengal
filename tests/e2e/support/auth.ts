import { expect, type Page } from "@playwright/test";

/**
 * Credentials for an existing Supabase admin account. Accounts are provisioned by hand
 * (see src/routes/auth.tsx), so the e2e suite reuses one rather than creating it.
 */
export function adminCredentials() {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD before running authenticated tests.",
    );
  }

  return { email, password };
}

export async function loginAsAdmin(page: Page) {
  const { email, password } = adminCredentials();

  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
  // The signed-in email is printed at the foot of the sidebar.
  await expect(page.locator("aside").getByText(email, { exact: true })).toBeVisible();
}
