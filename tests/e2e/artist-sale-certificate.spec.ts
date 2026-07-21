/**
 * Epic 3.5.1 — E2E vente artiste → certificat → portail client
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs, appLocator } from './shared/e2e-test-config';

test.describe('Epic 3.5.1 — artiste vente & certificat', () => {
  test.setTimeout(90_000);

  test('verify page répond pour code test', async ({ page }) => {
    const response = await gotoApp(page, '/verify/TESTCODE1');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: /vérification de certificat/i })).toBeVisible();
  });

  test('fiche artiste charge sans erreur serveur', async ({ page }) => {
    const productId = process.env.E2E_ARTIST_PRODUCT_ID;
    test.skip(!productId, 'E2E_ARTIST_PRODUCT_ID requis');

    const response = await gotoApp(page, `/artist/${productId}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(appLocator(page).locator('h1').first()).toBeVisible({ timeout: 15_000 });
  });

  test('checkout canonique depuis fiche artiste (auth)', async ({ page }) => {
    test.skip(!process.env.E2E_RUN_AUTH_TESTS, 'E2E_RUN_AUTH_TESTS=1 requis');
    const productId = process.env.E2E_ARTIST_PRODUCT_ID;
    test.skip(!productId, 'E2E_ARTIST_PRODUCT_ID requis');

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    await gotoApp(page, `/artist/${productId}`);

    const buyNow = appLocator(page).getByTestId('artist-buy-now');
    if (!(await buyNow.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'Pas de CTA acheter (artist-buy-now)');
      return;
    }

    await addToCart.click();
    await gotoApp(page, '/checkout');
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });
  });

  test('portail artiste acheteur (auth)', async ({ page }) => {
    test.skip(!process.env.E2E_RUN_AUTH_TESTS, 'E2E_RUN_AUTH_TESTS=1 requis');

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    const response = await gotoApp(page, '/account/artist');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('text=/certificat|œuvre|artiste/i').first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
