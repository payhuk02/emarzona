import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

test.describe('Blog plateforme', () => {
  test('index /blog charge sans erreur', async ({ page }) => {
    await page.goto(`${BASE}/blog`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('text=Erreur critique')).toHaveCount(0);
  });

  test('article /blog/:slug avec engagement', async ({ page }) => {
    await page.goto(`${BASE}/blog/lancer-boutique-emarzona-2026-guide-complet`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Partager|Share/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: /Commentaires|Comments/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
