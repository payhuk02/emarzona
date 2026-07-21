/**
 * E2E — Ancien panier retiré : redirections vers marketplace et checkout direct.
 */

import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';

test.describe('Panier retiré — redirections', () => {
  test('/cart redirige vers marketplace', async ({ page }) => {
    const response = await gotoApp(page, '/cart');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15_000 });
  });

  test('/checkout sans productId redirige vers marketplace', async ({ page }) => {
    await gotoApp(page, '/checkout');
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15_000 });
  });

  test('/checkout?productId= : achat direct (pas 500)', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000001&storeId=00000000-0000-0000-0000-000000000002'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/checkout/);
  });
});
