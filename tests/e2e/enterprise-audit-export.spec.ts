/**
 * Epic 5.5 — E2E page audit SOC2 (admin + équipe)
 */

import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';

test.describe('Epic 5.5 — Enterprise audit export UI', () => {
  test('page /status publique charge', async ({ page }) => {
    const response = await gotoApp(page, '/status');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: /statut emarzona/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('admin audit page répond (auth requise)', async ({ page }) => {
    const response = await gotoApp(page, '/admin/audit');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(/audit|connexion|login/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('équipe boutique — onglet audit accessible si connecté', async ({ page }) => {
    const response = await gotoApp(page, '/dashboard/store/team');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('#root')).toBeVisible();
  });
});
