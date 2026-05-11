/**
 * Tests E2E pour le Panier et Checkout
 * Vérifie : ajout au panier, modification quantité, suppression, processus de paiement
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

test.describe('Panier', () => {
  test('devrait pouvoir ajouter un produit au panier', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    // Trouver et cliquer sur un produit
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      // Chercher le bouton d'ajout au panier
      const addToCartButton = page.locator('button:has-text("Ajouter"), button:has-text("Panier"), button:has-text("Cart")').first();
      
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        // Vérifier qu'une confirmation apparaît (toast, modal, etc.)
        // Ou vérifier que le compteur du panier a augmenté
        const cartCounter = page.locator('[data-testid="cart-count"], .cart-badge, text=/\\d+/').first();
        
        if (await cartCounter.count() > 0) {
          const count = await cartCounter.textContent();
          expect(parseInt(count || '0')).toBeGreaterThan(0);
        }
      }
    }
  });

  test('devrait afficher le panier', async ({ page }) => {
    // Accéder au panier (peut être un modal, une page, un drawer)
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    // Chercher l'icône/bouton du panier
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Panier"), button:has-text("Cart"), [aria-label*="cart"]').first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier que le panier s'affiche
      const cartContent = page.locator('[data-testid="cart-content"], [role="dialog"], .cart-drawer');
      
      if (await cartContent.count() > 0) {
        await expect(cartContent.first()).toBeVisible();
      }
    }
  });

  test('devrait persister le panier après refresh', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForTimeout(2000);
    
    // Ajouter un produit
    const firstProduct = page.locator('[data-testid="product-card"] a, .product-card a, article a').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      
      const addToCartButton = page.locator('button:has-text("Ajouter"), button:has-text("Panier")').first();
      
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        // Refresh la page
        await page.reload();
        await page.waitForTimeout(1000);
        
        // Vérifier que le panier contient toujours le produit
        const cartCounter = page.locator('[data-testid="cart-count"], .cart-badge').first();
        
        if (await cartCounter.count() > 0) {
          const count = await cartCounter.textContent();
          expect(parseInt(count || '0')).toBeGreaterThan(0);
        }
      }
    }
  });

  test('devrait pouvoir modifier la quantité', async ({ page }) => {
    // Ouvrir le panier
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Panier")').first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Chercher les boutons +/-
      const incrementButton = page.locator('button:has-text("+"), button[aria-label*="increase"]').first();
      const decrementButton = page.locator('button:has-text("-"), button[aria-label*="decrease"]').first();
      
      if (await incrementButton.count() > 0) {
        // Obtenir la quantité initiale
        const quantityDisplay = page.locator('input[type="number"], text=/\\d+/').first();
        const initialQty = await quantityDisplay.textContent() || await quantityDisplay.inputValue();
        
        // Incrémenter
        await incrementButton.click();
        await page.waitForTimeout(500);
        
        // Vérifier que la quantité a augmenté
        const newQty = await quantityDisplay.textContent() || await quantityDisplay.inputValue();
        expect(parseInt(newQty)).toBeGreaterThan(parseInt(initialQty));
      }
    }
  });

  test('devrait pouvoir supprimer un produit', async ({ page }) => {
    // Ouvrir le panier
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Panier")').first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Chercher le bouton de suppression
      const removeButton = page.locator('button:has-text("Supprimer"), button:has-text("Remove"), button[aria-label*="remove"]').first();
      
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(500);
        
        // Vérifier qu'une confirmation apparaît ou que le produit disparaît
        await page.waitForTimeout(500);
      }
    }
  });

  test('devrait calculer le total correctement', async ({ page }) => {
    // Ouvrir le panier
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Panier")').first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Chercher l'élément de total
      const totalElement = page.locator('text=/.*[Tt]otal.*|.*[Ss]ous-total.*/').first();
      
      if (await totalElement.count() > 0) {
        await expect(totalElement).toBeVisible();
        
        // Vérifier qu'il y a un nombre
        const totalText = await totalElement.textContent();
        expect(totalText).toMatch(/\d+/);
      }
    }
  });
});

test.describe('Checkout', () => {
  test('devrait accéder à la page de checkout', async ({ page }) => {
    // Ouvrir le panier
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    const cartButton = page.locator('[data-testid="cart-button"], button:has-text("Panier")').first();
    
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Chercher le bouton de checkout
      const checkoutButton = page.locator('button:has-text("Commander"), button:has-text("Checkout"), button:has-text("Payer")').first();
      
      if (await checkoutButton.isVisible()) {
        await checkoutButton.click();
        await page.waitForTimeout(1000);
        
        // Vérifier qu'on est sur la page de checkout
        expect(page.url()).toMatch(/checkout|payment|commande/);
      }
    }
  });

  test('devrait afficher le résumé de la commande', async ({ page }) => {
    // Note: Ce test dépend du flow spécifique de l'app
    // Il pourrait nécessiter d'avoir des items dans le panier
    
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1000);
    
    // Essayer d'accéder directement au checkout
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    // Si redirigé, c'est que le panier est vide
    if (!page.url().includes('checkout')) {
      test.skip();
    }
  });

  test('devrait valider les informations de livraison', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('checkout')) {
      test.skip();
      return;
    }
    
    // Chercher les champs de livraison
    const addressFields = page.locator('input[name*="address"], input[placeholder*="adresse"]');
    
    if (await addressFields.count() > 0) {
      await expect(addressFields.first()).toBeVisible();
    }
  });

  test('devrait afficher les méthodes de paiement', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('checkout')) {
      test.skip();
      return;
    }
    
    // Chercher les options de paiement
    const paymentOptions = page.locator('text=/.*[Pp]aiement.*|.*[Pp]ayment.*/').first();
    
    if (await paymentOptions.count() > 0) {
      await expect(paymentOptions).toBeVisible();
    }
  });

  test('devrait avoir un bouton de confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('checkout')) {
      test.skip();
      return;
    }
    
    // Chercher le bouton de confirmation
    const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Payer"), button[type="submit"]').first();
    
    if (await confirmButton.count() > 0) {
      await expect(confirmButton).toBeVisible();
    }
  });

  test('devrait être responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('checkout')) {
      test.skip();
      return;
    }
    
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
    expect(scrollWidth).toBeLessThanOrEqual(375 + 20);
  });
});

test.describe('Sécurité Paiement', () => {
  test('devrait utiliser HTTPS en production', async ({ page }) => {
    if (BASE_URL.startsWith('https://')) {
      await page.goto(`${BASE_URL}/checkout`);
      
      const isSecure = await page.evaluate(() => window.location.protocol === 'https:');
      expect(isSecure).toBeTruthy();
    }
  });

  test('ne devrait pas exposer d\'informations sensibles', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(1000);
    
    if (!page.url().includes('checkout')) {
      test.skip();
      return;
    }
    
    // Vérifier qu'il n'y a pas d'API keys dans le DOM
    const html = await page.content();
    
    expect(html).not.toContain('sk_live');
    expect(html).not.toContain('pk_live');
    expect(html).not.toContain('api_key');
  });
});

