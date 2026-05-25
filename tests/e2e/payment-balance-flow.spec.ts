/**
 * Tests E2E pour le flux de paiement du solde restant
 * Couvre le parcours : commande partielle → paiement solde
 *
 * Pour exécuter: npm run test:e2e payment-balance-flow
 */

import { test, expect } from '@playwright/test';

test.describe('Flux de Paiement Solde Restant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/marketplace/, { timeout: 10000 });
  });

  test('Devrait afficher la page de paiement du solde', async ({ page }) => {
    await page.goto('/payments/balance/test-order-id');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/solde|balance|reste/i')).toBeVisible();
    const remainingAmount = page.locator('text=/\\d+/').first();
    await expect(remainingAmount).toBeVisible();
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay")');
    await expect(payButton).toBeVisible();
  });

  test('Devrait initier le paiement Moneroo pour le solde', async ({ page }) => {
    await page.goto('/payments/balance/test-order-id');
    await page.waitForLoadState('networkidle');
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay")');
    if (await payButton.isVisible()) {
      await payButton.click();
      await page.waitForURL(/moneroo\.com|\/checkout/, { timeout: 10000 });
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/moneroo\.com|\/checkout/);
    }
  });

  test('Devrait afficher une erreur si aucun solde à payer', async ({ page }) => {
    await page.goto('/payments/balance/test-order-id-no-balance');
    await page.waitForLoadState('networkidle');
    const errorMessage = page.locator('text=/aucun solde|no balance|déjà payé/i');
    const isVisible = await errorMessage.isVisible().catch(() => false);
    if (!isVisible) {
      const payButton = page.locator('button:has-text("Payer")');
      const isDisabled = await payButton.isDisabled().catch(() => false);
      expect(isDisabled).toBe(true);
    }
  });
});
