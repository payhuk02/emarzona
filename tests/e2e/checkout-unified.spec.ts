/**
 * Epic 3.6 — Checkout canonique : une route /checkout, modes par query.
 */

import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';
import { buildCheckoutUrl, resolveCheckoutMode } from '../../src/lib/checkout/checkout-route';

test.describe('Checkout unifié (Epic 3.6)', () => {
  test('contrat: modes cart / buy_now / auction', () => {
    expect(resolveCheckoutMode(new URLSearchParams())).toBe('cart');
    expect(resolveCheckoutMode(new URLSearchParams({ productId: 'p1' }))).toBe('buy_now');
    expect(resolveCheckoutMode(new URLSearchParams({ auction: 'a1' }))).toBe('auction');
  });

  test('contrat: buildCheckoutUrl canonique', () => {
    expect(buildCheckoutUrl()).toBe('/checkout');
    expect(buildCheckoutUrl({ productId: 'x', storeId: 'y' })).toBe(
      '/checkout?productId=x&storeId=y'
    );
  });

  test('/checkout charge sans erreur serveur (panier)', async ({ page }) => {
    const response = await gotoApp(page, '/checkout');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('/checkout?productId= charge buy-now shell', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000099&storeId=00000000-0000-0000-0000-000000000098'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('legacy /checkout/cart redirige vers /checkout', async ({ page }) => {
    await gotoApp(page, '/checkout/cart');
    await expect(page).toHaveURL(/\/checkout\/?$/, { timeout: 15_000 });
  });

  test('legacy /cart/checkout redirige vers /checkout', async ({ page }) => {
    await gotoApp(page, '/cart/checkout');
    await expect(page).toHaveURL(/\/checkout\/?$/, { timeout: 15_000 });
  });
});
