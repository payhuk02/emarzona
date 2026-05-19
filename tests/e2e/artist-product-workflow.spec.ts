import { test, expect } from '@playwright/test';

/**
 * Parcours minimal œuvre d'artiste (navigation publique + portail client).
 * Complète la couverture E2E manquante identifiée dans l'audit.
 */
test.describe('Artist product workflow', () => {
  test('collections page loads', async ({ page }) => {
    await page.goto('/collections');
    await expect(page).toHaveURL(/\/collections/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('account artist portal requires auth', async ({ page }) => {
    await page.goto('/account/artist');
    await expect(page).toHaveURL(/\/login/);
  });
});
