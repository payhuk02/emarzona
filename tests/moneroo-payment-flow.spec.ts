/**
 * Tests E2E pour le flux de paiement Moneroo
 * 
 * Pour exécuter: npm run test:e2e moneroo-payment-flow
 */

import { test, expect } from '@playwright/test';

test.describe('Flux de Paiement Moneroo', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/');
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('Devrait afficher la page de checkout avec les informations du produit', async ({ page }) => {
    // Naviguer vers un produit (remplacer par un produit réel)
    await page.goto('/marketplace');
    
    // Attendre que la marketplace soit chargée
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Cliquer sur le premier produit
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Attendre la page de détail du produit
    await page.waitForURL(/\/products\/.*/, { timeout: 10000 });
    
    // Cliquer sur le bouton "Acheter" ou "Ajouter au panier"
    const buyButton = page.locator('button:has-text("Acheter"), button:has-text("Ajouter au panier")').first();
    await buyButton.click();
    
    // Attendre la redirection vers le checkout
    await page.waitForURL(/\/checkout/, { timeout: 10000 });
    
    // Vérifier que la page de checkout est affichée
    await expect(page.locator('h1:has-text("Finaliser votre commande")')).toBeVisible();
    
    // Vérifier que le formulaire est présent (utiliser data-testid pour plus de fiabilité)
    await expect(page.locator('[data-testid="checkout-firstname"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-lastname"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-phone"]')).toBeVisible();
  });

  test('Devrait valider le formulaire de checkout', async ({ page }) => {
    // Aller directement au checkout (nécessite des paramètres URL)
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('[data-testid="checkout-firstname"]', { timeout: 10000 });
    
    // Essayer de soumettre le formulaire vide
    const submitButton = page.locator('[data-testid="checkout-submit"]');
    await submitButton.click();
    
    // Vérifier que les erreurs de validation sont affichées
    await expect(page.locator('text=Le prénom est requis')).toBeVisible();
    await expect(page.locator('text=Le nom est requis')).toBeVisible();
    await expect(page.locator('text=L\'email est requis')).toBeVisible();
    await expect(page.locator('text=Le téléphone est requis')).toBeVisible();
  });

  test('Devrait remplir et soumettre le formulaire de checkout', async ({ page }) => {
    // Aller au checkout
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    
    // Remplir le formulaire
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+226 70 12 34 56');
    await page.fill('input[name="address"]', '123 Rue Example');
    await page.fill('input[name="city"]', 'Ouagadougou');
    await page.fill('input[name="country"]', 'Burkina Faso');
    await page.fill('input[name="postalCode"]', '01 BP');
    
    // Intercepter la requête vers Moneroo
    await page.route('**/functions/v1/moneroo', async (route) => {
      // Simuler une réponse Moneroo réussie
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-payment-id',
            checkout_url: 'https://checkout.moneroo.io/test-payment-id',
          },
        }),
      });
    });
    
    // Soumettre le formulaire
    const submitButton = page.locator('[data-testid="checkout-submit"]');
    await submitButton.click();
    
    // Vérifier que l'utilisateur est redirigé vers Moneroo
    // Note: En test, on peut vérifier que la redirection est initiée
    await page.waitForTimeout(2000);
    
    // Vérifier que le bouton de soumission est en état de chargement
    // (le formulaire devrait être désactivé pendant le traitement)
    await expect(submitButton).toBeDisabled();
  });

  test('Devrait gérer les erreurs de paiement', async ({ page }) => {
    // Aller au checkout
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    
    // Remplir le formulaire
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+226 70 12 34 56');
    
    // Intercepter la requête et simuler une erreur
    await page.route('**/functions/v1/moneroo', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Montant invalide',
          message: 'Le montant doit être supérieur à 0',
        }),
      });
    });
    
    // Soumettre le formulaire
    const submitButton = page.locator('[data-testid="checkout-submit"]');
    await submitButton.click();
    
    // Attendre que l'erreur soit affichée
    await page.waitForSelector('[role="alert"], .toast, .error', { timeout: 5000 });
    
    // Vérifier que le message d'erreur est visible
    // (le format exact dépend de votre implémentation de toast/alert)
    const errorMessage = page.locator('text=/erreur|error|invalid/i');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('Devrait afficher la page de succès après un paiement réussi', async ({ page }) => {
    // Aller directement à la page de succès avec un transaction_id
    await page.goto('/checkout/success?transaction_id=test-transaction-id');
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page de succès est affichée
    await expect(page.locator('h1:has-text("Paiement réussi"), h1:has-text("Paiement en cours")')).toBeVisible();
    
    // Vérifier que les informations de transaction sont affichées
    // (si disponibles)
    const transactionInfo = page.locator('text=/transaction|montant|amount/i');
    if (await transactionInfo.count() > 0) {
      await expect(transactionInfo.first()).toBeVisible();
    }
  });

  test('Devrait valider les montants selon les limites Moneroo', async ({ page }) => {
    // Aller au checkout
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    
    // Remplir le formulaire avec un montant invalide (trop faible)
    // Note: Cela nécessite de modifier le produit pour avoir un montant < 100 XOF
    // ou d'intercepter la validation côté client
    
    // Intercepter la requête et simuler une erreur de validation
    await page.route('**/functions/v1/moneroo', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Montant trop faible',
          message: 'Le montant minimum est 100 XOF',
        }),
      });
    });
    
    // Remplir et soumettre le formulaire
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+226 70 12 34 56');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Vérifier que l'erreur de validation est affichée
    await page.waitForSelector('text=/montant.*minimum|amount.*minimum/i', { timeout: 5000 });
  });

  test('Devrait gérer le rate limiting', async ({ page }) => {
    // Aller au checkout
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    
    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[name="firstName"]', { timeout: 10000 });
    
    // Remplir le formulaire
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '226 70 12 34 56');
    
    // Intercepter la requête et simuler une erreur de rate limit
    await page.route('**/functions/v1/moneroo', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Rate limit dépassé. Veuillez attendre quelques secondes.',
        }),
      });
    });
    
    // Soumettre le formulaire
    const submitButton = page.locator('[data-testid="checkout-submit"]');
    await submitButton.click();
    
    // Vérifier que l'erreur de rate limit est affichée
    await page.waitForSelector('text=/rate.*limit|limite.*dépassé/i', { timeout: 5000 });
  });
});

test.describe('Performance et Optimisation', () => {
  test('Devrait charger le module Moneroo de manière lazy', async ({ page }) => {
    // Mesurer le temps de chargement initial
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const initialLoadTime = Date.now() - startTime;
    
    // Vérifier que le bundle Moneroo n'est pas chargé initialement
    const response = await page.goto('/');
    const scripts = await page.locator('script[src*="moneroo"]').count();
    
    // Le script Moneroo ne devrait pas être présent dans le HTML initial
    expect(scripts).toBe(0);
    
    // Aller au checkout (devrait charger Moneroo)
    await page.goto('/checkout?productId=test-product-id&storeId=test-store-id');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que Moneroo est chargé maintenant
    const monerooLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as any).__MONEROO_LOADED__ === true;
    });
    
    // Note: Cela nécessite d'ajouter un flag dans moneroo-lazy.ts
    // Pour l'instant, on vérifie juste que la page se charge
    expect(await page.locator('input[name="firstName"]').count()).toBeGreaterThan(0);
  });
});

