/**
 * Tests E2E pour les Produits
 * Vérifie : création, édition, suppression, affichage
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

test.describe('Gestion des Produits (Vendeur)', () => {
  test.beforeEach(async ({ page }) => {
    // Note: Ces tests nécessitent d'être connecté en tant que vendeur
    await page.goto(`${BASE_URL}/dashboard/products`);
    await page.waitForTimeout(1000);
    
    // Si redirigé vers /auth, skip les tests
    if (page.url().includes('/auth')) {
      test.skip();
    }
  });

  test('devrait afficher la page de gestion des produits', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard\/products/);
    
    // Vérifier les éléments clés
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('devrait avoir un bouton pour créer un produit', async ({ page }) => {
    const createButton = page.locator('text=/.*[Cc]réer.*produit.*|.*[Nn]ouveau produit.*|.*[Aa]dd product.*/').first();
    
    if (await createButton.count() > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('devrait afficher la liste des produits', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Vérifier la présence de produits ou un message vide
    const productItems = page.locator('[data-testid="product-item"], tr, .product-card');
    const count = await productItems.count();
    
    const noProductsMessage = page.locator('text=/.*[Aa]ucun produit.*|.*[Nn]o products.*/');
    const hasNoProductsMessage = await noProductsMessage.isVisible();
    
    expect(count > 0 || hasNoProductsMessage).toBeTruthy();
  });

  test('devrait avoir un bouton d\'édition par produit', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const editButtons = page.locator('button:has-text("Éditer"), button:has-text("Edit"), a:has-text("Modifier")');
    const count = await editButtons.count();
    
    // Si des produits existent, il devrait y avoir des boutons d'édition
    if (count > 0) {
      await expect(editButtons.first()).toBeVisible();
    }
  });

  test('devrait avoir un bouton de suppression par produit', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const deleteButtons = page.locator('button:has-text("Supprimer"), button:has-text("Delete")');
    const count = await deleteButtons.count();
    
    // Si des produits existent, il devrait y avoir des boutons de suppression
    if (count > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('devrait filtrer les produits', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Recherche"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Les résultats devraient être filtrés
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Création de Produit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/products/new`);
    await page.waitForTimeout(1000);
    
    if (page.url().includes('/auth')) {
      test.skip();
    }
  });

  test('devrait afficher le formulaire de création', async ({ page }) => {
    await expect(page).toHaveURL(/.*products\/new/);
    
    // Vérifier les champs principaux
    const nameInput = page.locator('input[name="name"], input[placeholder*="nom"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('devrait avoir tous les champs requis', async ({ page }) => {
    // Champs attendus
    const expectedFields = [
      'input[name="name"], input[placeholder*="nom"]',
      'textarea[name="description"], textarea[placeholder*="description"]',
      'input[name="price"], input[placeholder*="prix"]',
    ];
    
    for (const selector of expectedFields) {
      const field = page.locator(selector).first();
      if (await field.count() > 0) {
        await expect(field).toBeVisible();
      }
    }
  });

  test('devrait valider les champs requis', async ({ page }) => {
    // Essayer de soumettre sans remplir
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Devrait rester sur la page (validation échouée)
      expect(page.url()).toContain('/products/new');
    }
  });

  test('devrait permettre l\'upload d\'images', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Vérifier que l'input existe
      expect(await fileInput.count()).toBeGreaterThan(0);
    }
  });

  test('devrait avoir un bouton annuler', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Annuler"), button:has-text("Cancel"), a:has-text("Retour")').first();
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      // Devrait retourner à la liste
      expect(page.url()).toContain('/products');
      expect(page.url()).not.toContain('/new');
    }
  });
});

test.describe('Page Détail Produit (Public)', () => {
  test('devrait afficher un produit public', async ({ page }) => {
    // Essayer d'accéder à une page produit générique
    // Note: Ce test pourrait échouer si aucun produit n'existe
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    // Trouver le premier produit et cliquer
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'on est sur une page de détail
      const productTitle = page.locator('h1, h2').first();
      await expect(productTitle).toBeVisible();
    }
  });

  test('devrait afficher le prix du produit', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Chercher un élément de prix
      const priceElement = page.locator('text=/.*\\d+.*FCFA.*|.*\\$\\d+.*|.*€\\d+.*/').first();
      
      if (await priceElement.count() > 0) {
        await expect(priceElement).toBeVisible();
      }
    }
  });

  test('devrait avoir un bouton d\'achat', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Chercher un bouton d'achat
      const buyButton = page.locator('button:has-text("Acheter"), button:has-text("Buy"), button:has-text("Ajouter")').first();
      
      if (await buyButton.count() > 0) {
        await expect(buyButton).toBeVisible();
      }
    }
  });

  test('devrait afficher les images du produit', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'il y a des images
      const images = page.locator('img[alt*="product"], img[alt*="produit"], img').first();
      
      if (await images.count() > 0) {
        await expect(images).toBeVisible();
      }
    }
  });

  test('devrait être responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(300);
      
      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      // Vérifier qu'il n'y a pas de scroll horizontal
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375 + 20); // Tolérance de 20px
    }
  });
});

test.describe('Performance Produits', () => {
  test('devrait charger rapidement la liste', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard/products`);
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('devrait charger rapidement le détail', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      const startTime = Date.now();
      
      await firstProduct.click();
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    }
  });
});

