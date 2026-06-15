/**
 * E2E — Shell navigation unifié (persona, horizontal nav, drawer mobile)
 */
import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, appLocator, gotoApp, loginAs } from './shared/e2e-test-config';

test.describe('Navigation shell — invité', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test('marketplace invité sans sidebar applicative', async ({ page }) => {
    await gotoApp(page, '/marketplace');
    await expect(appLocator(page).locator('[data-sidebar="sidebar"]')).toHaveCount(0);
    await expect(appLocator(page).getByTestId('horizontal-context-nav')).toHaveCount(0);
  });

  test('enchères invité sans sidebar applicative', async ({ page }) => {
    await gotoApp(page, '/auctions');
    await expect(appLocator(page).locator('[data-sidebar="sidebar"]')).toHaveCount(0);
    await expect(appLocator(page).getByTestId('horizontal-context-nav')).toHaveCount(0);
  });
});

test.describe('Navigation shell — acheteur authentifié', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test.beforeEach(async ({ page }) => {
    test.skip(
      !E2E_TEST_CONFIG.buyerEmail,
      'E2E_BUYER_EMAIL requis pour les parcours acheteur authentifiés'
    );
    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
  });

  test('compte affiche la navigation horizontale buyer', async ({ page }) => {
    await gotoApp(page, '/account');
    await expect(appLocator(page).locator('[data-sidebar="sidebar"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(appLocator(page).getByTestId('horizontal-context-nav')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('enchères connectées utilisent le shell unifié', async ({ page }) => {
    await gotoApp(page, '/auctions');
    await expect(appLocator(page).locator('[data-sidebar="sidebar"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(appLocator(page).getByTestId('horizontal-context-nav')).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe('Navigation shell — bascule persona', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test.beforeEach(async ({ page }) => {
    test.skip(
      !E2E_TEST_CONFIG.vendorEmail,
      'E2E_VENDOR_EMAIL requis pour la bascule persona vendeur'
    );
    await loginAs(page, E2E_TEST_CONFIG.vendorEmail, E2E_TEST_CONFIG.vendorPassword);
    await gotoApp(page, '/dashboard');
  });

  test('bascule vendeur → acheteur redirige vers /account', async ({ page }) => {
    const root = appLocator(page);
    await expect(root.getByTestId('persona-tab-seller')).toBeVisible({ timeout: 20_000 });
    await root.getByTestId('persona-tab-buyer').click();
    await page.waitForURL(/\/account/, { timeout: 20_000 });
    await expect(root.getByTestId('horizontal-context-nav')).toBeVisible({ timeout: 20_000 });
  });

  test('bascule acheteur → vendeur redirige vers /dashboard', async ({ page }) => {
    const root = appLocator(page);
    await root.getByTestId('persona-tab-buyer').click();
    await page.waitForURL(/\/account/, { timeout: 20_000 });
    await root.getByTestId('persona-tab-seller').click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  });
});

test.describe('Navigation shell — drawer mobile', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    test.skip(!E2E_TEST_CONFIG.buyerEmail, 'E2E_BUYER_EMAIL requis pour le drawer mobile buyer');
    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    await gotoApp(page, '/account');
  });

  test('ouvre le drawer vertical gauche depuis un domaine buyer', async ({ page }) => {
    const root = appLocator(page);
    const mobileNav = root.getByTestId('horizontal-context-nav-mobile');
    await expect(mobileNav).toBeVisible({ timeout: 20_000 });

    const discoverTrigger = mobileNav.getByRole('button', { name: /découvrir/i });
    await discoverTrigger.click();

    const drawer = root.getByTestId('mobile-domain-drawer-decouvrir');
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await expect(drawer).toHaveAttribute('id', 'mobile-domain-drawer-decouvrir');
  });
});
