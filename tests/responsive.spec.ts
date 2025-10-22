// tests/responsive.spec.ts
import { test, expect } from '@playwright/test';

const breakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

const pages = [
  { name: 'Landing', path: '/', critical: true },
  { name: 'Marketplace', path: '/marketplace', critical: true },
  { name: 'Storefront', path: '/stores/test-store', critical: true },
  { name: 'ProductDetail', path: '/stores/test-store/products/test-product', critical: true },
  { name: 'Auth', path: '/auth', critical: false }
];

// Test de responsivité pour chaque page
pages.forEach(page => {
  Object.entries(breakpoints).forEach(([device, viewport]) => {
    test(`${page.name} - ${device} (${viewport.width}x${viewport.height})`, async ({ page: testPage }) => {
      await testPage.setViewportSize(viewport);
      await testPage.goto(page.path);
      
      // Attendre que la page soit chargée
      await testPage.waitForLoadState('networkidle');
      
      // Vérifier qu'il n'y a pas de scroll horizontal
      const bodyWidth = await testPage.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Tolérance de 20px
      
      // Vérifier les éléments critiques selon la page
      if (page.name === 'Marketplace' || page.name === 'Storefront') {
        await testProductGridResponsiveness(testPage, device);
      }
      
      if (page.name === 'Landing') {
        await testLandingResponsiveness(testPage, device);
      }
      
      if (page.name === 'Auth') {
        await testAuthResponsiveness(testPage, device);
      }
      
      // Prendre une capture d'écran
      await testPage.screenshot({ 
        path: `tests/screenshots/${page.name}-${device}.png`,
        fullPage: true 
      });
    });
  });
});

// Test spécifique pour les grilles de produits
async function testProductGridResponsiveness(page, device) {
  // Vérifier le nombre de colonnes selon le breakpoint
  const productCards = page.locator('[data-testid="product-card"], .product-card');
  await expect(productCards).toBeVisible();
  
  const cardCount = await productCards.count();
  if (cardCount > 0) {
    // Vérifier la première carte
    const firstCard = productCards.first();
    
    // Vérifier que la carte a une hauteur minimale
    const cardHeight = await firstCard.boundingBox();
    expect(cardHeight?.height).toBeGreaterThan(300);
    
    // Vérifier les éléments de la carte
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('h3, .product-title')).toBeVisible();
    await expect(firstCard.locator('button')).toBeVisible();
    
    // Vérifier les tailles des boutons (touch targets)
    const buttons = firstCard.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const buttonBox = await button.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Touch target minimum
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }
    }
  }
}

// Test spécifique pour la page d'accueil
async function testLandingResponsiveness(page, device) {
  // Vérifier le header
  const header = page.locator('header');
  await expect(header).toBeVisible();
  
  // Vérifier le menu mobile sur mobile
  if (device === 'mobile') {
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], button:has-text("Menu")');
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible();
    }
  }
  
  // Vérifier les CTA
  const ctaButtons = page.locator('button:has-text("Commencer"), button:has-text("Découvrir")');
  const ctaCount = await ctaButtons.count();
  
  for (let i = 0; i < ctaCount; i++) {
    const cta = ctaButtons.nth(i);
    const ctaBox = await cta.boundingBox();
    if (ctaBox) {
      expect(ctaBox.height).toBeGreaterThanOrEqual(44);
    }
  }
}

// Test spécifique pour la page d'authentification
async function testAuthResponsiveness(page, device) {
  // Vérifier le formulaire
  const form = page.locator('form');
  await expect(form).toBeVisible();
  
  // Vérifier les champs de saisie
  const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
  const inputCount = await inputs.count();
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const inputBox = await input.boundingBox();
    if (inputBox) {
      expect(inputBox.height).toBeGreaterThanOrEqual(44);
    }
  }
  
  // Vérifier les boutons
  const buttons = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Inscription")');
  const buttonCount = await buttons.count();
  
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const buttonBox = await button.boundingBox();
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  }
}

// Test de performance et accessibilité
test('Performance et accessibilité - Marketplace', async ({ page }) => {
  await page.goto('/marketplace');
  await page.waitForLoadState('networkidle');
  
  // Vérifier les métriques de performance
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
    };
  });
  
  expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 secondes max
  expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // 1.5 secondes max
  
  // Vérifier l'accessibilité
  const accessibilityIssues = await page.evaluate(() => {
    const issues = [];
    
    // Vérifier les images sans alt
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`Images sans alt: ${imagesWithoutAlt.length}`);
    }
    
    // Vérifier les boutons sans aria-label
    const buttonsWithoutLabel = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    if (buttonsWithoutLabel.length > 0) {
      issues.push(`Boutons sans label: ${buttonsWithoutLabel.length}`);
    }
    
    return issues;
  });
  
  expect(accessibilityIssues).toHaveLength(0);
});

// Test de régression visuelle
test('Régression visuelle - Cartes produits', async ({ page }) => {
  await page.goto('/marketplace');
  await page.waitForLoadState('networkidle');
  
  // Test sur desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator('.product-card').first()).toHaveScreenshot('product-card-desktop.png');
  
  // Test sur tablette
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.product-card').first()).toHaveScreenshot('product-card-tablet.png');
  
  // Test sur mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.product-card').first()).toHaveScreenshot('product-card-mobile.png');
});