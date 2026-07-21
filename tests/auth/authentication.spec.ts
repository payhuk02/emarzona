import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests for login, logout, and registration flows
 */

const hasTestCredentials = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should display landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    await expect(page).toHaveTitle(/Emarzona/);

    // Title is set on the loading shell before premium content mounts.
    await expect(page.locator('.lp-hero h1')).toBeVisible({ timeout: 15_000 });

    const footer = page.locator('footer#apropos');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible({ timeout: 15_000 });
    await expect(footer).toContainText(/Emarzona/i);
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    // Check for validation message (any alert)
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    const loginForm = page
      .locator('form[aria-label]')
      .filter({ has: page.locator('#password-login') });
    await loginForm
      .locator('input[name="email-login"], input[type="email"]')
      .first()
      .fill('invalid@test.com');
    await loginForm.locator('#password-login').fill('wrongpassword');
    await loginForm.locator('button[type="submit"]').click();

    // Alert inline, toast, or auth error copy (Supabase / mock backends vary).
    const errorSignal = page
      .getByRole('alert')
      .or(page.getByText(/incorrect|invalid|erreur|mot de passe|credentials|impossible/i));
    await expect(errorSignal.first()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/(login|auth)/);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
    await page.goto('/login');

    await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD!);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Should see dashboard elements
    await expect(page.locator('text=/tableau de bord|dashboard/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click logout button
    await page.click('text=/déconnexion|logout/i');

    // Should redirect to landing or auth page
    await expect(page).toHaveURL(/\/|\/auth/);
  });

  test('should toggle between login and register', async ({ page }) => {
    await page.goto('/login');

    // Check if register toggle exists
    const registerLink = page.locator('text=/créer un compte|register|inscription/i');
    if (await registerLink.isVisible()) {
      await registerLink.click();

      // Should show additional fields for registration
      await expect(page.locator('input[name="name"], input[placeholder*="nom"]')).toBeVisible();
    }
  });

  test('should persist session after page reload', async ({ page }) => {
    test.skip(!hasTestCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=/tableau de bord|dashboard/i')).toBeVisible();
  });

  test('should redirect to auth when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard/products');

    await expect(page).toHaveURL(/\/(auth|login)/, { timeout: 10000 });
  });
});
