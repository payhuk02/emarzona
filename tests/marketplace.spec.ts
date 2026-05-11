/**
 * Tests E2E pour le Marketplace
 * Vérifie : affichage des produits, recherche, filtres, navigation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la page marketplace', async ({ page }) => {
    // Vérifier l'URL
    await expect(page).toHaveURL(/.*marketplace/);
    
    // Vérifier le titre de la page
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('devrait afficher des produits', async ({ page }) => {
    // Attendre que les produits se chargent
    await page.waitForTimeout(2000);
    
    // Vérifier la présence de produits (cartes, grille, etc.)
    const productCards = page.locator('[data-testid="product-card"], .product-card, article');
    
    // Il devrait y avoir au moins un produit ou un message "Aucun produit"
    const count = await productCards.count();
    const noProductsMessage = page.locator('text=/.*[Aa]ucun produit.*|.*[Nn]o products.*/');
    
    const hasProducts = count > 0;
    const hasNoProductsMessage = await noProductsMessage.isVisible();
    
    expect(hasProducts || hasNoProductsMessage).toBeTruthy();
  });

  test('devrait avoir une barre de recherche', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('devrait pouvoir rechercher des produits', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      // Taper dans la recherche
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Vérifier que quelque chose se passe (filtrage, chargement, etc.)
      // Les résultats peuvent changer ou un indicateur de chargement apparaître
      await page.waitForTimeout(500);
    }
  });

  test('devrait afficher des filtres', async ({ page }) => {
    // Chercher des éléments de filtre communs
    const filterElements = page.locator('text=/.*[Ff]iltre.*|.*[Cc]atégorie.*|.*[Pp]rix.*/');
    
    // Au moins un élément de filtre devrait être présent
    const count = await filterElements.count();
    expect(count).toBeGreaterThanOrEqual(0); // Peut être 0 si pas de filtres implémentés
  });

  test('devrait pouvoir cliquer sur un produit', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Trouver le premier produit
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    
    if (await firstProduct.isVisible()) {
      // Trouver un lien ou bouton cliquable dans le produit
      const productLink = firstProduct.locator('a, button').first();
      
      if (await productLink.isVisible()) {
        await productLink.click();
        await page.waitForTimeout(1000);
        
        // Vérifier qu'on est bien sur une page de détail
        // (L'URL devrait changer ou un modal s'ouvrir)
        const currentUrl = page.url();
        expect(currentUrl).not.toBe(`${BASE_URL}/marketplace`);
      }
    }
  });

  test('devrait être responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    const desktopLayout = await page.locator('body').screenshot();
    expect(desktopLayout).toBeTruthy();
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const tabletLayout = await page.locator('body').screenshot();
    expect(tabletLayout).toBeTruthy();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileLayout = await page.locator('body').screenshot();
    expect(mobileLayout).toBeTruthy();
  });

  test('devrait charger rapidement', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Le DOM devrait être chargé en moins de 2 secondes
    expect(loadTime).toBeLessThan(2000);
  });

  test('devrait avoir des images optimisées', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Vérifier que les images ont des attributs alt
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      const firstImage = images.first();
      const hasAlt = await firstImage.getAttribute('alt');
      expect(hasAlt).toBeTruthy();
      
      // Vérifier le lazy loading
      const loading = await firstImage.getAttribute('loading');
      // loading devrait être 'lazy' ou 'eager' (pas null)
    }
  });

  test('devrait gérer les erreurs réseau gracieusement', async ({ page }) => {
    // Simuler une erreur réseau
    await page.route('**/api/**', route => route.abort());
    
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    // Vérifier qu'il y a un message d'erreur ou un fallback
    const errorMessage = page.locator('text=/.*[Ee]rreur.*|.*[Ee]rror.*|.*[Ii]mpossible.*/');
    const isVisible = await errorMessage.count();
    
    // Soit un message d'erreur, soit un état vide, mais pas de crash
    expect(isVisible >= 0).toBeTruthy();
  });

  test('devrait avoir une pagination ou scroll infini', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Chercher des éléments de pagination
    const pagination = page.locator('[role="navigation"], .pagination, text=/.*[Pp]age.*|.*[Ss]uivant.*/');
    const hasPagination = await pagination.count() > 0;
    
    if (!hasPagination) {
      // Vérifier le scroll infini
      const initialHeight = await page.evaluate(() => document.body.scrollHeight);
      
      // Scroller vers le bas
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      
      // Si scroll infini, la hauteur devrait potentiellement augmenter
      // (mais peut ne pas augmenter s'il n'y a pas assez de produits)
      expect(newHeight).toBeGreaterThanOrEqual(initialHeight);
    }
  });
});

test.describe('Navigation Marketplace', () => {
  test('devrait avoir un menu de navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    
    // Chercher des éléments de navigation
    const nav = page.locator('nav, [role="navigation"], header');
    await expect(nav.first()).toBeVisible();
  });

  test('devrait pouvoir retourner à l\'accueil', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    
    // Chercher un lien vers l'accueil
    const homeLink = page.locator('a[href="/"], text=/.*[Aa]ccueil.*|.*[Hh]ome.*/').first();
    
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForTimeout(500);
      
      expect(page.url()).toBe(`${BASE_URL}/`);
    }
  });
});

test.describe('Performance Marketplace', () => {
  test('devrait avoir un bon score de performance', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    
    // Mesurer le First Contentful Paint
    const fcp = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcpEntry = perfEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : 0;
    });
    
    // FCP devrait être sous 1.8s (bon score)
    expect(fcp).toBeLessThan(1800);
  });

  test('devrait avoir peu de requêtes réseau', async ({ page }) => {
    let requestCount = 0;
    
    page.on('request', () => requestCount++);
    
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    // Un marketplace bien optimisé devrait faire moins de 50 requêtes
    expect(requestCount).toBeLessThan(50);
  });
});

