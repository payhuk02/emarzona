/**
 * Checkout direct mono-produit — routage et redirections legacy.
 */

import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';
import { buildCheckoutUrl, resolveCheckoutMode } from '../../src/lib/checkout/checkout-route';

test.describe('Checkout direct', () => {
  test('contrat: invalid sans productId, buy_now avec productId', () => {
    expect(resolveCheckoutMode(new URLSearchParams())).toBe('invalid');
    expect(resolveCheckoutMode(new URLSearchParams({ productId: 'p1' }))).toBe('buy_now');
    expect(resolveCheckoutMode(new URLSearchParams({ auction: 'a1' }))).toBe('auction');
  });

  test('contrat: buildCheckoutUrl sans params → marketplace', () => {
    expect(buildCheckoutUrl()).toBe('/marketplace');
    expect(buildCheckoutUrl({ productId: 'x', storeId: 'y' })).toBe(
      '/checkout?productId=x&storeId=y'
    );
  });

  test('/checkout sans productId redirige vers marketplace', async ({ page }) => {
    await gotoApp(page, '/checkout');
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15_000 });
  });

  test('/checkout?productId= charge buy-now shell', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000099&storeId=00000000-0000-0000-0000-000000000098'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('legacy /cart redirige vers marketplace', async ({ page }) => {
    await gotoApp(page, '/cart');
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15_000 });
  });

  test('legacy /checkout/cart redirige vers marketplace', async ({ page }) => {
    await gotoApp(page, '/checkout/cart');
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15_000 });
  });
});
