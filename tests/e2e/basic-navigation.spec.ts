import { test, expect } from '@playwright/test';

test.describe('Navigation de base', () => {
  test("devrait charger la page d'accueil", async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Emarzona/);
  });

  test('devrait naviguer vers la marketplace', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('lp-nav-link-marketplace').click();
    await expect(page).toHaveURL(/marketplace/);
  });
});
