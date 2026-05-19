import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

test.describe('Affiliation — parcours public et gardes auth', () => {
  test('lien court invalide affiche une erreur', async ({ page }) => {
    await page.goto(`${BASE_URL}/aff/code-inexistant-e2e-xyz`);

    await expect(page.getByText(/introuvable|expiré|erreur/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('dashboard affilié requiert une connexion', async ({ page }) => {
    await page.goto(`${BASE_URL}/affiliate/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('dashboard affilié cours requiert une connexion', async ({ page }) => {
    await page.goto(`${BASE_URL}/affiliate/courses`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('gestion affiliés boutique requiert une connexion', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/affiliates`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Affiliation — tracking cookie (unité navigateur)', () => {
  test('le cookie emarzona_affiliate peut être lu après pose', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.evaluate(() => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      document.cookie = `emarzona_affiliate=${encodeURIComponent('test-link-id-123')}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
    });

    const cookieValue = await page.evaluate(() => {
      const match = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('emarzona_affiliate='));
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    });

    expect(cookieValue).toBe('test-link-id-123');
  });

  test('paramètre URL ?aff= sur une fiche produit ne provoque pas de crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await expect(page.locator('body')).toBeVisible();

    const productLink = page.locator('a[href*="/digital/"], a[href*="/physical/"]').first();
    const href = await productLink.getAttribute('href').catch(() => null);

    if (href) {
      const url = href.startsWith('http')
        ? `${href}?aff=test-affiliate-link`
        : `${BASE_URL}${href}?aff=test-affiliate-link`;
      const response = await page.goto(url);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
