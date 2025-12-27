/**
/**
 * Tests E2E pour le flux de paiement du solde restant
 * Couvre le parcours : commande partielle â†’ paiement solde
 * 
 * Pour exÃ©cuter: npm run test:e2e payment-balance-flow
 */

import { test, expect } from '@playwright/test';

test.describe('Flux de Paiement Solde Restant', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/marketplace/, { timeout: 10000 });
  });

  test('Devrait afficher la page de paiement du solde', async ({ page }) => {
    // Naviguer vers une commande avec solde restant
    // (nÃ©cessite une commande avec payment_type = 'percentage' et remaining_amount > 0)
    await page.goto('/payments/balance/test-order-id');
    
    // Attendre le chargement
    await page.waitForLoadState('networkidle');

    // VÃ©rifier que les informations de la commande sont affichÃ©es
    await expect(page.locator('text=/solde|balance|reste/i')).toBeVisible();
    
    // VÃ©rifier le montant restant
    const remainingAmount = page.locator('text=/\\d+/').first();
    await expect(remainingAmount).toBeVisible();

    // VÃ©rifier la prÃ©sence du bouton de paiement
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay")');
    await expect(payButton).toBeVisible();
  });

  test('Devrait initier le paiement Moneroo pour le solde', async ({ page }) => {
    await page.goto('/payments/balance/test-order-id');
    await page.waitForLoadState('networkidle');

    // Cliquer sur le bouton de paiement
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay")');
    if (await payButton.isVisible()) {
      await payButton.click();

      // Devrait rediriger vers Moneroo checkout
      await page.waitForURL(/moneroo\.com|\/checkout/, { timeout: 10000 });
      
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/moneroo\.com|\/checkout/);
    }
  });

  test('Devrait afficher une erreur si aucun solde Ã  payer', async ({ page }) => {
    // Naviguer vers une commande sans solde restant
    await page.goto('/payments/balance/test-order-id-no-balance');
    await page.waitForLoadState('networkidle');

    // Devrait afficher un message d'erreur ou d'information
    const errorMessage = page.locator('text=/aucun solde|no balance|dÃ©jÃ  payÃ©/i');
    const isVisible = await errorMessage.isVisible().catch(() => false);
    
    // Soit un message d'erreur, soit le bouton est dÃ©sactivÃ©
    if (!isVisible) {
      const payButton = page.locator('button:has-text("Payer")');
      const isDisabled = await payButton.isDisabled().catch(() => false);
      expect(isDisabled).toBe(true);
    }
  });
});

/**
 * Tests E2E pour le flux de paiement du solde restant
 * Couvre le parcours : commande partielle â†’ paiement solde
 * 
 * Pour exÃ©cuter: npm run test:e2e payment-balance-flow
 */

import { test, expect } from '@playwright/test';

test.describe('Flux de Paiement Solde Restant', () => {
