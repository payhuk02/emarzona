import { test, expect } from '@playwright/test';

test.describe('Navigation de base', () => {
  test('devrait charger la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Emarzona/);
  });

  test('devrait naviguer vers la marketplace', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Marketplace');
    await expect(page).toHaveURL(/marketplace/);
  });
});

