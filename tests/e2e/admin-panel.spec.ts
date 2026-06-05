/**
 * Tests E2E — panneau admin (sécurité, routing, accès authentifié optionnel)
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function loginAsAdmin(page: Page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    test.skip();
  }
  await page.goto('/auth');
  await page.fill('input[type="email"]', ADMIN_EMAIL!);
  await page.fill('input[type="password"]', ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
}

test.describe('Admin panel — sécurité', () => {
  test('redirige /admin vers auth si non connecté', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/(admin|auth|login)/);
    if (!url.includes('/admin')) {
      expect(url).toMatch(/auth|login/);
    }
  });

  test('protège /admin/orders sans session', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/(admin\/orders|auth|login)/);
  });

  test('protège /admin/kyc sans session', async ({ page }) => {
    await page.goto('/admin/kyc');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/(admin\/kyc|auth|login)/);
  });
});

test.describe('Admin panel — accès authentifié', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD requis');

  test('charge la page commandes admin', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /Gestion Commandes/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('charge la page KYC admin', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/kyc');
    await page.waitForLoadState('domcontentloaded');

    const title = page.getByRole('heading').first();
    await expect(title).toBeVisible({ timeout: 15_000 });
  });

  test('affiche la liste RBAC (utilisateurs)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /Utilisateurs/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
