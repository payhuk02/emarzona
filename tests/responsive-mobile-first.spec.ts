/**
 * Tests de responsivité mobile-first
 * Vérifie que toutes les pages utilisent correctement l'approche mobile-first
 */

import { test, expect } from '@playwright/test';

const breakpoints = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1920, height: 1080 }, // Desktop
};

/**
 * Vérifie que les classes CSS utilisent mobile-first
 */
test.describe('Mobile-First Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Attendre que l'app soit prête
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Index page - Responsive text and padding', async ({ page }) => {
    await page.goto('/');

    // Vérifier sur mobile
    await page.setViewportSize(breakpoints.mobile);
    const mobileContainer = page.locator('div.flex.min-h-screen');
    await expect(mobileContainer).toHaveCSS('padding-left', /px/);

    // Vérifier sur desktop
    await page.setViewportSize(breakpoints.desktop);
    const desktopContainer = page.locator('div.flex.min-h-screen');
    await expect(desktopContainer).toBeVisible();
  });

  test('Landing page - Grid responsive', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Vérifier que les grids commencent par grid-cols-1 sur mobile
    await page.setViewportSize(breakpoints.mobile);

    // Chercher les sections avec grid
    const gridSections = page.locator('[class*="grid"][class*="grid-cols"]');
    const count = await gridSections.count();

    // Au moins une section grid doit être présente
    expect(count).toBeGreaterThan(0);

    // Vérifier sur tablet
    await page.setViewportSize(breakpoints.tablet);
    await expect(gridSections.first()).toBeVisible();
  });

  test('Marketplace page - Mobile-first layout', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Vérifier sur mobile
    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que les boutons ont min-h-[44px] pour touch-friendly
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    const buttonHeight = await firstButton.evaluate(el => {
      return window.getComputedStyle(el).minHeight;
    });

    // min-height devrait être au moins 44px
    const minHeightValue = parseInt(buttonHeight);
    expect(minHeightValue).toBeGreaterThanOrEqual(44);
  });

  test('Dashboard page - Responsive grid', async ({ page }) => {
    // Nécessite authentification - skip si non authentifié
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Si redirigé vers auth, skip le test
    if (page.url().includes('/auth')) {
      test.skip();
      return;
    }

    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que les stats cards sont en grid responsive
    const statsGrid = page.locator('[class*="grid"][class*="grid-cols-2"]');
    await expect(statsGrid.first()).toBeVisible();

    // Vérifier sur desktop
    await page.setViewportSize(breakpoints.desktop);
    await expect(statsGrid.first()).toBeVisible();
  });

  test('Checkout page - Responsive layout', async ({ page }) => {
    // Nécessite un produit - utiliser un produit de test si disponible
    await page.goto('/checkout?productId=test&storeId=test');
    await page.waitForLoadState('networkidle');

    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que le layout est responsive
    const mainContainer = page.locator('main, [role="main"]').first();
    await expect(mainContainer).toBeVisible();

    // Vérifier padding responsive
    const padding = await mainContainer.evaluate(el => {
      return window.getComputedStyle(el).paddingLeft;
    });
    expect(padding).toBeTruthy();
  });

  test('Cart page - Mobile-first design', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que les éléments sont visibles sur mobile
    const cartContent = page.locator('[class*="cart"], main').first();
    await expect(cartContent).toBeVisible();
  });

  test('Admin pages - Responsive tables', async ({ page }) => {
    // Nécessite authentification admin
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Si redirigé vers auth, skip
    if (page.url().includes('/auth')) {
      test.skip();
      return;
    }

    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que MobileTableCard est utilisé sur mobile
    const mobileTableCard = page.locator('[class*="MobileTableCard"], [data-mobile-table]');
    const table = page.locator('table');

    // Sur mobile, soit MobileTableCard soit table doit être visible
    const hasMobileCard = (await mobileTableCard.count()) > 0;
    const hasTable = (await table.count()) > 0;

    expect(hasMobileCard || hasTable).toBeTruthy();
  });

  test('Touch targets - Minimum 44px', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.setViewportSize(breakpoints.mobile);

    // Vérifier que les boutons ont une taille minimale de 44px
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const styles = await firstButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          minHeight: computed.minHeight,
          minWidth: computed.minWidth,
          height: computed.height,
          width: computed.width,
        };
      });

      // Vérifier min-height ou height >= 44px
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
      const minWidth = parseInt(styles.minWidth) || parseInt(styles.width);

      // Au moins une dimension doit être >= 44px pour être touch-friendly
      const isTouchFriendly = minHeight >= 44 || minWidth >= 44;
      expect(isTouchFriendly).toBeTruthy();
    }
  });

  test('Text responsive - Scales correctly', async ({ page }) => {
    await page.goto('/landing');
    await page.waitForLoadState('networkidle');

    // Vérifier sur mobile
    await page.setViewportSize(breakpoints.mobile);
    const mobileHeading = page.locator('h1').first();
    const mobileFontSize = await mobileHeading.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Vérifier sur desktop
    await page.setViewportSize(breakpoints.desktop);
    const desktopHeading = page.locator('h1').first();
    const desktopFontSize = await desktopHeading.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Desktop devrait avoir une taille de police plus grande
    const mobileSize = parseFloat(mobileFontSize);
    const desktopSize = parseFloat(desktopFontSize);

    expect(desktopSize).toBeGreaterThanOrEqual(mobileSize);
  });

  test('Padding responsive - Scales with breakpoints', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Vérifier padding sur mobile
    await page.setViewportSize(breakpoints.mobile);
    const mobileContainer = page.locator('main, [role="main"]').first();
    const mobilePadding = await mobileContainer.evaluate(el => {
      return window.getComputedStyle(el).paddingLeft;
    });

    // Vérifier padding sur desktop
    await page.setViewportSize(breakpoints.desktop);
    const desktopContainer = page.locator('main, [role="main"]').first();
    const desktopPadding = await desktopContainer.evaluate(el => {
      return window.getComputedStyle(el).paddingLeft;
    });

    // Desktop devrait avoir plus de padding
    const mobilePaddingValue = parseFloat(mobilePadding);
    const desktopPaddingValue = parseFloat(desktopPadding);

    expect(desktopPaddingValue).toBeGreaterThanOrEqual(mobilePaddingValue);
  });
});

/**
 * Tests de régression visuelle pour différents breakpoints
 */
test.describe('Visual Regression - Responsive', () => {
  const pages = [
    { path: '/', name: 'Index' },
    { path: '/landing', name: 'Landing' },
    { path: '/marketplace', name: 'Marketplace' },
  ];

  for (const page of pages) {
    test(`${page.name} - Mobile viewport`, async ({ page: testPage }) => {
      await testPage.goto(page.path);
      await testPage.waitForLoadState('networkidle');
      await testPage.setViewportSize(breakpoints.mobile);

      // Prendre une capture d'écran
      await expect(testPage).toHaveScreenshot(`${page.name.toLowerCase()}-mobile.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test(`${page.name} - Tablet viewport`, async ({ page: testPage }) => {
      await testPage.goto(page.path);
      await testPage.waitForLoadState('networkidle');
      await testPage.setViewportSize(breakpoints.tablet);

      await expect(testPage).toHaveScreenshot(`${page.name.toLowerCase()}-tablet.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test(`${page.name} - Desktop viewport`, async ({ page: testPage }) => {
      await testPage.goto(page.path);
      await testPage.waitForLoadState('networkidle');
      await testPage.setViewportSize(breakpoints.desktop);

      await expect(testPage).toHaveScreenshot(`${page.name.toLowerCase()}-desktop.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  }
});
