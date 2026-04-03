/**
 * Tests de Régression Visuelle
 * Capture et compare des screenshots pour détecter les changements visuels non intentionnels
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

const breakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

const pages = [
  { name: 'home', path: '/', fullPage: true },
  { name: 'marketplace', path: '/marketplace', fullPage: true },
  { name: 'auth', path: '/auth', fullPage: false },
];

test.describe('Régression Visuelle - Pages Principales', () => {
  pages.forEach(page => {
    Object.entries(breakpoints).forEach(([device, viewport]) => {
      test(`${page.name} - ${device}`, async ({ page: testPage }) => {
        await testPage.setViewportSize(viewport);
        await testPage.goto(`${BASE_URL}${page.path}`);
        await testPage.waitForLoadState('networkidle');
        
        // Attendre que les animations se terminent
        await testPage.waitForTimeout(1000);
        
        // Masquer les éléments dynamiques (dates, compteurs, etc.)
        await testPage.evaluate(() => {
          // Masquer les timestamps
          document.querySelectorAll('[data-testid="timestamp"], .timestamp, time').forEach(el => {
            (el as HTMLElement).style.visibility = 'hidden';
          });
          
          // Masquer les animations infinies
          document.querySelectorAll('[class*="animate"]').forEach(el => {
            (el as HTMLElement).style.animation = 'none';
          });
        });
        
        // Prendre le screenshot
        await expect(testPage).toHaveScreenshot(`${page.name}-${device}.png`, {
          fullPage: page.fullPage,
          maxDiffPixels: 100, // Tolérance de 100 pixels de différence
        });
      });
    });
  });
});

test.describe('Régression Visuelle - Composants', () => {
  test('Boutons - États', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    // Trouver différents types de boutons
    const primaryButton = page.locator('button').first();
    
    if (await primaryButton.isVisible()) {
      // État normal
      await expect(primaryButton).toHaveScreenshot('button-normal.png');
      
      // État hover
      await primaryButton.hover();
      await page.waitForTimeout(300);
      await expect(primaryButton).toHaveScreenshot('button-hover.png');
    }
  });

  test('Cartes Produits', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();
    
    if (await productCard.isVisible()) {
      await expect(productCard).toHaveScreenshot('product-card.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('Header/Navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('header, nav').first();
    
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('header.png');
    }
  });

  test('Footer', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer').first();
    
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer.png', {
        fullPage: false,
      });
    }
  });
});

test.describe('Régression Visuelle - États Interactifs', () => {
  test('Formulaires - Validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    // Essayer de soumettre sans remplir
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Screenshot avec les erreurs de validation
      await expect(page).toHaveScreenshot('form-validation-error.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Modal/Dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    // Chercher un bouton qui ouvre un modal
    const modalTrigger = page.locator('button:has-text("Détails"), button:has-text("Voir"), button:has-text("Info")').first();
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      await page.waitForTimeout(500);
      
      // Screenshot du modal ouvert
      await expect(page).toHaveScreenshot('modal-open.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('Dropdown/Select', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    // Chercher un dropdown
    const dropdown = page.locator('select, [role="combobox"]').first();
    
    if (await dropdown.isVisible()) {
      // Screenshot fermé
      await expect(dropdown).toHaveScreenshot('dropdown-closed.png');
      
      // Ouvrir le dropdown
      await dropdown.click();
      await page.waitForTimeout(300);
      
      // Screenshot ouvert
      await expect(page).toHaveScreenshot('dropdown-open.png', {
        maxDiffPixels: 100,
      });
    }
  });
});

test.describe('Régression Visuelle - Dark Mode', () => {
  test('Home - Dark Mode', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Chercher le toggle dark mode
    const darkModeToggle = page.locator('button:has-text("Dark"), button:has-text("Sombre"), [aria-label*="dark"]').first();
    
    if (await darkModeToggle.isVisible()) {
      // Activer le dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      // Screenshot en dark mode
      await expect(page).toHaveScreenshot('home-dark-mode.png', {
        fullPage: true,
        maxDiffPixels: 200,
      });
    }
  });

  test('Marketplace - Dark Mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    const darkModeToggle = page.locator('button:has-text("Dark"), button:has-text("Sombre"), [aria-label*="dark"]').first();
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('marketplace-dark-mode.png', {
        fullPage: true,
        maxDiffPixels: 200,
      });
    }
  });
});

test.describe('Régression Visuelle - États de Chargement', () => {
  test('Skeleton Loader', async ({ page }) => {
    // Bloquer les requêtes pour voir les loaders
    await page.route('**/api/**', route => {
      // Délai de 5 secondes
      setTimeout(() => route.continue(), 5000);
    });
    
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(1000);
    
    // Screenshot pendant le chargement
    await expect(page).toHaveScreenshot('loading-skeleton.png', {
      maxDiffPixels: 100,
    });
  });

  test('État Vide', async ({ page }) => {
    // Note: Ce test peut nécessiter un état spécial (pas de produits, etc.)
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Chercher un état vide
    const emptyState = page.locator('text=/.*[Aa]ucun.*|.*[Nn]o items.*/');
    
    if (await emptyState.isVisible()) {
      await expect(page).toHaveScreenshot('empty-state.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Régression Visuelle - Performance', () => {
  test('First Paint', async ({ page }) => {
    // Mesurer le rendu initial
    await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded' });
    
    // Screenshot juste après le premier paint
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('first-paint.png', {
      maxDiffPixels: 200,
    });
  });

  test('Above The Fold', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Screenshot uniquement de la partie visible sans scroll
    await expect(page).toHaveScreenshot('above-fold.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });
});

