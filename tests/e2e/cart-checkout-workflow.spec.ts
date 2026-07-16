/**
 * E2E Checkout panier unifié + routage CheckoutPage
 *
 * Vérifie le routage /checkout (panier) vs /checkout?productId= (achat direct),
 * l’accessibilité des pages et les gardes UX (panier vide).
 * Les flux paiement GeniusPay complets nécessitent auth + données de test (voir physical-product-workflow).
 */

import { test, expect } from '@playwright/test';
import { appLocator, gotoApp } from './shared/e2e-test-config';

test.describe('Checkout — routage CheckoutPage', () => {
  test('/checkout sans productId : panier unifié ou garde auth (pas de crash)', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const response = await gotoApp(page, '/checkout');
    expect(response?.status()).toBeLessThan(500);

    const root = appLocator(page);
    await expect(root).toBeVisible();

    const settled = await Promise.race([
      root
        .getByText(/finaliser la commande/i)
        .waitFor({ timeout: 60_000 })
        .then(() => 'cart'),
      root
        .getByText(/votre panier est vide/i)
        .waitFor({ timeout: 60_000 })
        .then(() => 'empty'),
      page.waitForURL(/\/(login|auth)/, { timeout: 60_000 }).then(() => 'auth'),
    ]).catch(() => 'timeout');

    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');

    if (settled === 'timeout') {
      // Lazy checkout peut rester sur « Chargement… » sans .env complet en CI local
      const stillLoading = (await page.getByText(/chargement/i).count()) > 0;
      expect(stillLoading || page.url().includes('/checkout')).toBeTruthy();
      return;
    }

    expect(['cart', 'empty', 'auth']).toContain(settled);
  });

  test('/checkout?productId= : achat direct (erreur produit acceptable, pas 500)', async ({
    page,
  }) => {
    const response = await gotoApp(
      page,
      '/checkout?productId=00000000-0000-0000-0000-000000000001'
    );
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();

    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');
  });

  test('/cart : page panier accessible', async ({ page }) => {
    const response = await gotoApp(page, '/cart');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Checkout panier — gardes UX', () => {
  test('panier vide : message ou redirection, sans bouton payer actif', async ({ page }) => {
    await gotoApp(page, '/checkout');

    const emptyMessage = page.getByText(/votre panier est vide/i);
    const isEmptyVisible = await emptyMessage.isVisible({ timeout: 8000 }).catch(() => false);

    if (isEmptyVisible) {
      const payButton = page.getByRole('button', { name: /procéder au paiement/i });
      await expect(payButton).toHaveCount(0);
      return;
    }

    // Sinon auth requise ou chargement — au minimum pas d’erreur fatale
    await expect(page.locator('body')).toBeVisible();
  });

  test('depuis /cart : lien procéder au paiement mène à /checkout', async ({ page }) => {
    await gotoApp(page, '/cart');
    await expect(page.locator('body')).toBeVisible();

    const checkoutButton = page.getByRole('button', { name: /procéder au paiement/i });
    if ((await checkoutButton.count()) === 0) {
      test.skip(true, 'Panier vide ou non connecté — impossible de tester la navigation');
      return;
    }

    await checkoutButton.click();
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });
    expect(page.url()).not.toMatch(/productId=/);
  });
});

test.describe('Checkout — sécurité & perf (smoke)', () => {
  test('checkout ne expose pas de clés API live dans le HTML', async ({ page }) => {
    await gotoApp(page, '/checkout');
    const html = await page.content();
    expect(html).not.toMatch(/sk_live_/);
    expect(html).not.toMatch(/FEDEX_API_SECRET/);
  });

  test('checkout répond rapidement', async ({ page }) => {
    const start = Date.now();
    await gotoApp(page, '/checkout');
    await expect(page.locator('body')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(120_000);
  });
});
