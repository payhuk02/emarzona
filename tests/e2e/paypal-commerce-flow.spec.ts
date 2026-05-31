/**
 * E2E PayPal Commerce — connexions vendeur + checkout (orchestration V2)
 *
 * Tests smoke (pas de paiement sandbox réel sans credentials).
 * CI : définir E2E_VENDOR_EMAIL / E2E_VENDOR_PASSWORD pour tests authentifiés.
 *
 * npx playwright test tests/e2e/paypal-commerce-flow.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';
import { E2E_TEST_CONFIG, appLocator, gotoApp, loginAs } from './shared/e2e-test-config';

const orchestrationEnabled = process.env.VITE_PAYMENT_ORCHESTRATION_V2 === 'true';

test.describe('PayPal Commerce — connexions paiement vendeur', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.E2E_VENDOR_EMAIL,
      'E2E_VENDOR_EMAIL requis pour les tests vendeur authentifiés'
    );
    await loginAs(page, E2E_TEST_CONFIG.vendorEmail, E2E_TEST_CONFIG.vendorPassword);
  });

  test('affiche la page connexions avec Stripe et PayPal', async ({ page }) => {
    const response = await gotoApp(page, '/dashboard/payment-connections');
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByText(/connexions paiement/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/stripe connect/i)).toBeVisible();
    await expect(page.getByText(/paypal commerce/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /connecter paypal|compléter paypal/i })
    ).toBeVisible();
  });

  test('bouton Connecter PayPal ne provoque pas d’erreur 500', async ({ page }) => {
    await gotoApp(page, '/dashboard/payment-connections');
    await page.getByText(/paypal commerce/i).waitFor({ timeout: 15_000 });

    const connectBtn = page.getByRole('button', {
      name: /connecter paypal|compléter paypal/i,
    });
    await expect(connectBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        res => res.url().includes('paypal-partner-onboard') && res.request().method() === 'POST',
        { timeout: 15_000 }
      ),
      connectBtn.click(),
    ]).catch(() => [null]);

    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Checkout — option PayPal (RPC dynamique)', () => {
  test('avec orchestration V2 : page checkout charge sans crash', async ({ page }) => {
    test.skip(!orchestrationEnabled, 'VITE_PAYMENT_ORCHESTRATION_V2=true requis');

    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000001'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();

    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');
  });
});

test.describe('Payment success — retour PayPal', () => {
  test('accepte query params provider=paypal', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/payment/success?order_id=00000000-0000-0000-0000-000000000099&provider=paypal&token=TEST'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(appLocator(page).getByRole('heading', { name: /paiement réussi/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
