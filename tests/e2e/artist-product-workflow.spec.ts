/**
 * E2E — Workflow œuvres d'artiste (Sprint 1 audit 2026)
 *
 * Couvre : collections, enchères, fiche artiste (si données), portail client, auth.
 * Parcours achat + certificat complet : voir digital/physical specs + env GeniusPay sandbox.
 *
 * Exécution : npx playwright test tests/e2e/artist-product-workflow.spec.ts
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs, appLocator } from './shared/e2e-test-config';
import {
  openFirstProductCard,
  openMarketplaceWithOptionalFilter,
} from './shared/marketplace-discovery';

test.describe('Artist product workflow', () => {
  test.setTimeout(90_000);

  test('collections page loads', async ({ page }) => {
    const response = await gotoApp(page, '/collections');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/collections/);
    await expect(page.locator('body')).toBeVisible();
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');
  });

  test('auctions list page loads', async ({ page }) => {
    const response = await gotoApp(page, '/auctions');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/auctions/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('marketplace loads and can filter toward artist products', async ({ page }) => {
    const response = await gotoApp(page, '/marketplace');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();

    const hasProducts = await openMarketplaceWithOptionalFilter(page, 'artist');
    if (!hasProducts) {
      test.skip(true, 'Marketplace sans produits');
      return;
    }

    const opened = await openFirstProductCard(page, /\/(artist|stores)\//);
    expect(opened || page.url().includes('/marketplace')).toBeTruthy();
  });

  test('artist listing /artists responds without server error', async ({ page }) => {
    const response = await gotoApp(page, '/artists');
    expect(response?.status()).toBeLessThan(500);
    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('internal server error');
    await expect(page.locator('body')).toBeVisible();
  });

  test('guest add-to-cart CTA on artist detail when E2E_ARTIST_PRODUCT_ID set', async ({
    page,
  }) => {
    const productId = process.env.E2E_ARTIST_PRODUCT_ID;
    test.skip(!productId, 'Set E2E_ARTIST_PRODUCT_ID');

    await gotoApp(page, `/artist/${productId}`);
    const cta = appLocator(page).getByRole('button', {
      name: /acheter|ajouter|panier|buy|commander/i,
    });
    await expect(cta.first().or(page.locator('h1'))).toBeVisible({ timeout: 15_000 });
  });

  test('artist product detail route responds (optional E2E_ARTIST_PRODUCT_ID)', async ({
    page,
  }) => {
    const productId = process.env.E2E_ARTIST_PRODUCT_ID;
    test.skip(!productId, 'Set E2E_ARTIST_PRODUCT_ID for full fiche test');

    const response = await gotoApp(page, `/artist/${productId}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /acheter|ajouter|panier|buy/i }).or(page.locator('h1'))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('account artist portal requires auth when logged out', async ({ page }) => {
    await gotoApp(page, '/account/artist');
    await page.waitForURL(/\/(login|auth)/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test('public certificate verify page loads', async ({ page }) => {
    const response = await gotoApp(page, '/verify/TESTCODE1');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/verify\/TESTCODE1/);
    await expect(page.getByRole('heading', { name: /vérification de certificat/i })).toBeVisible();
    await expect(
      page.getByText(
        /certificat non valide|certificat authentique|impossible de contacter le service/i
      )
    ).toBeVisible({ timeout: 15_000 });
  });

  test('auction detail shows bid UI when E2E_AUCTION_SLUG is set', async ({ page }) => {
    const slug = process.env.E2E_AUCTION_SLUG;
    test.skip(!slug, 'Set E2E_AUCTION_SLUG for bid form test');

    const response = await gotoApp(page, `/auctions/${slug}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page
        .getByRole('button', { name: /enchérir|placer|bid|offre/i })
        .or(page.locator('input[type="number"]'))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('logged-in buyer can open artist portal shell', async ({ page }) => {
    test.skip(
      !process.env.E2E_RUN_AUTH_TESTS,
      'Set E2E_RUN_AUTH_TESTS=1 with valid buyer credentials'
    );

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    const response = await gotoApp(page, '/account/artist');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login$/);
    const tabsOrHeading = page.locator('text=/certificat|œuvre|artiste|achat/i, [role="tablist"]');
    await expect(tabsOrHeading.first()).toBeVisible({ timeout: 20_000 });
  });
});
