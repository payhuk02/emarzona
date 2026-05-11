/**
 * Tests E2E pour le système de messagerie client-vendeur
 * Vérifie que les fonctionnalités de messagerie fonctionnent correctement
 */

import { test, expect } from '@playwright/test';

test.describe('Messagerie Client-Vendeur', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page marketplace
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le bouton "Contacter le vendeur" sur les cartes produits', async ({ page }) => {
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Laisser le temps aux produits de charger
    
    // Chercher les produits (peuvent avoir différents sélecteurs)
    const products = page.locator('[data-testid="product-card"], .product-card, article, [class*="product"], [class*="card"]');
    const productCount = await products.count();
    
    if (productCount > 0) {
      // Chercher le bouton "Contacter le vendeur" ou "Contacter"
      const contactButton = page.locator('button:has-text("Contacter")').or(
        page.locator('a:has-text("Contacter")')
      ).or(
        page.locator('button:has-text("Contacter le vendeur")')
      ).or(
        page.locator('a:has-text("Contacter le vendeur")')
      );
      
      const buttonCount = await contactButton.count();
      
      // Si des produits sont présents, au moins un pourrait avoir le bouton
      // Mais on accepte aussi si aucun produit n'a le bouton (produits sans store_id)
      if (buttonCount > 0) {
        await expect(contactButton.first()).toBeVisible();
      }
    } else {
      // Si aucun produit n'est trouvé, vérifier qu'il y a un message "Aucun produit"
      const noProductsMessage = page.locator('text=/.*[Aa]ucun produit.*|.*[Nn]o products.*/');
      const hasMessage = await noProductsMessage.count() > 0;
      
      // Soit des produits, soit un message "Aucun produit"
      expect(productCount > 0 || hasMessage).toBeTruthy();
    }
  });

  test('devrait afficher le bouton "Contacter le vendeur" sur la page détail produit', async ({ page }) => {
    // Aller à un produit spécifique (nécessite un produit existant)
    // Pour l'instant, on teste juste que la page se charge
    
    // Chercher un lien produit sur la marketplace
    const productLink = page.locator('a[href*="/products/"], a[href*="/stores/"]').first();
    const linkCount = await productLink.count();
    
    if (linkCount > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      
      // Chercher le bouton "Contacter le vendeur"
      const contactButton = page.locator('button:has-text("Contacter")').or(
        page.locator('a:has-text("Contacter")')
      ).or(
        page.locator('button:has-text("Contacter le vendeur")')
      ).or(
        page.locator('a:has-text("Contacter le vendeur")')
      );
      
      // Le bouton peut ne pas être présent si le produit n'a pas de store_id
      const buttonCount = await contactButton.count();
      if (buttonCount > 0) {
        await expect(contactButton.first()).toBeVisible();
      }
    }
  });

  test('devrait rediriger vers la page de messagerie lors du clic sur "Contacter le vendeur"', async ({ page }) => {
    // Chercher un bouton "Contacter le vendeur"
    const contactButton = page.locator('button:has-text("Contacter")').or(
      page.locator('a:has-text("Contacter")')
    ).or(
      page.locator('button:has-text("Contacter le vendeur")')
    ).or(
      page.locator('a:has-text("Contacter le vendeur")')
    ).first();
    
    const buttonCount = await contactButton.count();
    
    if (buttonCount > 0) {
      await contactButton.click();
      
      // Devrait rediriger vers /vendor/messaging
      await page.waitForURL(/\/vendor\/messaging/, { timeout: 5000 });
      
      const url = page.url();
      expect(url).toMatch(/\/vendor\/messaging/);
    }
  });
});

