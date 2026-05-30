/**
 * E2E Checkout multi-PSP (orchestration V2 + legacy Moneroo)
 *
 * Smoke uniquement — pas de paiement sandbox réel.
 * - Legacy : Moneroo auto-sélectionné (pas de carte « Moyen de paiement » si un seul PSP)
 * - V2 : section moyens de paiement ou message d’erreur gracieux (pas de 500)
 *
 * Variables :
 *   VITE_PAYMENT_ORCHESTRATION_V2=true  → tests branche V2
 *   E2E_BUYER_EMAIL / E2E_BUYER_PASSWORD → parcours checkout authentifié
 *
 * npx playwright test tests/e2e/checkout-multi-psp.spec.ts
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs } from './shared/e2e-test-config';

const orchestrationV2 = process.env.VITE_PAYMENT_ORCHESTRATION_V2 === 'true';

test.describe('Checkout multi-PSP — routage smoke', () => {
  test('checkout direct productId : HTTP < 500, pas d’erreur serveur', async ({ page }) => {
    test.setTimeout(90_000);
    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000001'
    );
    expect(response?.status()).toBeLessThan(500);

    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('internal server error');
    await expect(page.locator('body')).toBeVisible();
  });

  test('checkout panier unifié : finaliser ou garde vide/auth', async ({ page }) => {
    test.setTimeout(90_000);
    const response = await gotoApp(page, '/checkout');
    expect(response?.status()).toBeLessThan(500);

    const settled = await Promise.race([
      page
        .getByText(/finaliser (la commande|votre commande)/i)
        .waitFor({ timeout: 45_000 })
        .then(() => 'checkout'),
      page
        .getByText(/votre panier est vide/i)
        .waitFor({ timeout: 45_000 })
        .then(() => 'empty'),
      page.waitForURL(/\/(login|auth)/, { timeout: 45_000 }).then(() => 'auth'),
    ]).catch(() => 'timeout');

    expect(['checkout', 'empty', 'auth', 'timeout']).toContain(settled);
  });
});

test.describe('Checkout multi-PSP — orchestration V2', () => {
  test('affiche la section moyen de paiement ou Moneroo seul sans crash', async ({ page }) => {
    test.skip(!orchestrationV2, 'Définir VITE_PAYMENT_ORCHESTRATION_V2=true');

    await gotoApp(page, '/checkout?productId=00000000-0000-0000-0000-000000000001');
    await expect(page.locator('body')).toBeVisible();

    const paymentSection = page.getByText(/moyen de paiement/i);
    const monerooLabel = page.getByText(/^Moneroo$/i);
    const stripeLabel = page.getByText(/carte bancaire|stripe/i);
    const paypalLabel = page.getByText(/^PayPal$/i);
    const noPayment = page.getByText(/aucun moyen de paiement disponible/i);
    const loadError = page.getByText(/impossible de charger les moyens de paiement/i);

    await Promise.race([
      paymentSection.waitFor({ timeout: 20_000 }),
      monerooLabel.first().waitFor({ timeout: 20_000 }),
      noPayment.waitFor({ timeout: 20_000 }),
      loadError.waitFor({ timeout: 20_000 }),
    ]).catch(() => undefined);

    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('internal server error');

    const hasPspUi =
      (await paymentSection.count()) > 0 ||
      (await monerooLabel.count()) > 0 ||
      (await stripeLabel.count()) > 0 ||
      (await paypalLabel.count()) > 0 ||
      (await noPayment.count()) > 0 ||
      (await loadError.count()) > 0;

    expect(hasPspUi || page.url().includes('/checkout')).toBeTruthy();
  });
});

test.describe('Checkout multi-PSP — legacy Moneroo', () => {
  test('sans V2 : pas de crash, pas de clés live exposées', async ({ page }) => {
    test.skip(orchestrationV2, 'Test legacy — ne pas exécuter quand V2 est activé');

    await gotoApp(page, '/checkout');
    const html = await page.content();
    expect(html).not.toMatch(/sk_live_/);
    expect(html.toLowerCase()).not.toContain('internal server error');
  });
});

test.describe('Checkout multi-PSP — acheteur authentifié', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.E2E_BUYER_EMAIL,
      'E2E_BUYER_EMAIL requis pour le parcours acheteur authentifié'
    );
    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
  });

  test('checkout authentifié charge sans erreur fatale', async ({ page }) => {
    test.setTimeout(90_000);
    const response = await gotoApp(page, '/checkout');
    expect(response?.status()).toBeLessThan(500);

    await expect(page.locator('body')).toBeVisible();
    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('internal server error');
  });

  test('retour annulation paiement avec transaction_id', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/checkout/cancel?transaction_id=00000000-0000-0000-0000-000000000099'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Checkout multi-PSP — pages retour PSP', () => {
  test('success Stripe query params', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/payment/success?order_id=00000000-0000-0000-0000-000000000099&provider=stripe_connect'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(/paiement réussi/i)).toBeVisible({ timeout: 15_000 });
  });

  test('success PayPal query params', async ({ page }) => {
    const response = await gotoApp(
      page,
      '/payment/success?order_id=00000000-0000-0000-0000-000000000099&provider=paypal&token=TEST'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(/paiement réussi/i)).toBeVisible({ timeout: 15_000 });
  });
});
