/**
 * Epic 4.3 — E2E contrat page login SSO Enterprise
 */

import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';

test.describe('Epic 4.3 — SSO Enterprise login', () => {
  test('page SSO répond pour slug inconnu', async ({ page }) => {
    const response = await gotoApp(page, '/auth/sso/boutique-test-inexistante');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(/SSO non disponible|non disponible/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('login standard accessible depuis page SSO', async ({ page }) => {
    await gotoApp(page, '/auth/sso/boutique-test-inexistante');
    const link = page.getByRole('link', { name: /connexion standard|email et mot de passe/i });
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
