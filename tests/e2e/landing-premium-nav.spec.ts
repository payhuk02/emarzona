import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';

test.describe('Landing premium mega-menus — desktop hover', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('hover on Solutions opens the panel with sell-ways and Protect', async ({ page }) => {
    await gotoApp(page, '/');
    await page.getByTestId('lp-nav-trigger-solutions').hover();
    const panel = page.getByTestId('lp-nav-panel-solutions');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/Produits physiques|Physical products/i);
    await expect(panel).toContainText(/Emarzona Protect/);
    await expect(panel).not.toContainText(/MoneyFusion|GeniusPay|Stripe|PayPal/i);
  });

  test('hover on Fonctionnalités shows mobile money, not a vendor rail', async ({ page }) => {
    await gotoApp(page, '/');
    await page.getByTestId('lp-nav-trigger-features').hover();
    const panel = page.getByTestId('lp-nav-panel-features');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/mobile money/i);
    await expect(panel).not.toContainText(/MoneyFusion|GeniusPay/i);
  });

  test('from /blog, a features mega link opens the dedicated feature page', async ({ page }) => {
    await gotoApp(page, '/blog');
    await page.getByTestId('lp-nav-trigger-features').hover();
    await expect(page.getByTestId('lp-nav-panel-features')).toBeVisible();
    await page.getByTestId('lp-nav-item-features-storefront').click();
    await expect(page).toHaveURL(/\/features\/storefront/);
  });
});

test.describe('Landing premium mega-menus — mobile accordion', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('drawer accordion expands Solutions and keeps a single section open', async ({ page }) => {
    await gotoApp(page, '/');
    await page.getByRole('button', { name: /Ouvrir le menu|Open menu/i }).click();
    await page.getByTestId('lp-nav-mobile-accordion-solutions').click();
    await expect(page.getByText(/Produits physiques|Physical products/i).first()).toBeVisible();

    await page.getByTestId('lp-nav-mobile-accordion-resources').click();
    await expect(page.getByTestId('lp-nav-mobile-accordion-solutions')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByTestId('lp-nav-mobile-accordion-resources')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(page.getByText(/^Blog$/).first()).toBeVisible();
  });
});

test.describe('Marketing solution / feature pages', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('solutions physical page renders hero image and nav', async ({ page }) => {
    await gotoApp(page, '/solutions/physical');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const hero = page
      .locator('img[alt]')
      .filter({ has: page.locator('visible=true') })
      .first();
    await expect(page.locator('img[src*="hero-physical"]')).toBeVisible();
    await expect(hero).toBeVisible();
  });

  test('features storefront page renders default hero image', async ({ page }) => {
    await gotoApp(page, '/features/storefront');
    await expect(page.locator('img[src*="hero-storefront"]')).toBeVisible();
  });
});
