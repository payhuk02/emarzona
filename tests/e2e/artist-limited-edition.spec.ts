/**
 * E2E — Éditions limitées œuvre d'artiste (audit T1 / réservation checkout)
 *
 * Variables :
 * - E2E_ARTIST_LIMITED_PRODUCT_ID : fiche produit édition limitée
 * - E2E_RUN_AUTH_TESTS=1 + identifiants acheteur : parcours panier → checkout (RPC réservation)
 *
 * Exécution : npx playwright test tests/e2e/artist-limited-edition.spec.ts
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs } from './shared/e2e-test-config';

const LIMITED_PRODUCT_ID = process.env.E2E_ARTIST_LIMITED_PRODUCT_ID;

test.describe('Artist limited edition', () => {
  test.setTimeout(120_000);

  test('limited edition product shows tracking badge', async ({ page }) => {
    test.skip(!LIMITED_PRODUCT_ID, 'Set E2E_ARTIST_LIMITED_PRODUCT_ID');

    const response = await gotoApp(page, `/artist/${LIMITED_PRODUCT_ID}`);
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByTestId('edition-limited-badge')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/édition limitée/i)).toBeVisible();
    await expect(page.getByTestId('artist-add-to-cart')).toBeVisible();
  });

  test('checkout triggers edition reservation RPC for artist cart', async ({ page }) => {
    test.skip(!LIMITED_PRODUCT_ID, 'Set E2E_ARTIST_LIMITED_PRODUCT_ID');
    test.skip(
      !process.env.E2E_RUN_AUTH_TESTS,
      'Set E2E_RUN_AUTH_TESTS=1 with valid buyer credentials'
    );

    let reservationRpcSeen = false;

    await page.route('**/rest/v1/rpc/check_and_increment_artist_product_version**', async route => {
      reservationRpcSeen = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            success: true,
            current_version: 1,
            available_editions: 1,
            message: 'Réservé',
          },
        ]),
      });
    });

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);

    await gotoApp(page, `/artist/${LIMITED_PRODUCT_ID}`);
    await page.getByTestId('artist-add-to-cart').click();

    await gotoApp(page, '/checkout');
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });

    const payOrContinue = page.getByRole('button', {
      name: /payer|continuer|commander|valider|checkout/i,
    });
    if (
      await payOrContinue
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await payOrContinue
        .first()
        .click({ timeout: 5_000 })
        .catch(() => undefined);
    }

    await page.waitForTimeout(2_000);
    expect(reservationRpcSeen).toBe(true);
  });
});
