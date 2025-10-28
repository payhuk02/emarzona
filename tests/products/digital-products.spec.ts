import { test, expect } from '@playwright/test';

/**
 * Digital Products Tests
 * Tests for digital product creation and management
 */

test.describe('Digital Products', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to create digital product', async ({ page }) => {
    // Navigate to products page
    await page.click('text=/produits|products/i');
    
    // Click create product
    await page.click('text=/créer|create|ajouter/i');
    
    // Should show product type selector
    await expect(page.locator('text=/type de produit|product type/i')).toBeVisible();
    
    // Select digital product
    await page.click('text=/numérique|digital/i');
    
    // Should show digital product wizard
    await expect(page.locator('text=/informations de base|basic info/i')).toBeVisible();
  });

  test('should create digital product with all steps', async ({ page }) => {
    // Navigate to product creation
    await page.goto('/products/create');
    await page.click('text=/numérique|digital/i');
    
    // Step 1: Basic Info
    await page.fill('input[name="title"], input[placeholder*="titre"]', 'Test Digital Product E2E');
    await page.fill('textarea[name="description"]', 'This is a test digital product created via E2E tests');
    await page.fill('input[name="price"], input[type="number"]', '29.99');
    
    // Select category if exists
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }
    
    // Next step
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Step 2: Files (skip for now - file upload is complex)
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Step 3: License Settings
    const licenseCheckbox = page.locator('input[type="checkbox"][name*="license"]');
    if (await licenseCheckbox.isVisible()) {
      await licenseCheckbox.check();
      await page.fill('input[name*="devices"]', '3');
    }
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Step 4: SEO
    await page.fill('input[name="metaTitle"], input[placeholder*="SEO"]', 'Test Digital Product SEO');
    await page.fill('textarea[name="metaDescription"]', 'SEO description for test product');
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Step 5: FAQs (optional, skip)
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Step 6: Review & Publish
    await expect(page.locator('text=Test Digital Product E2E')).toBeVisible();
    await page.click('button:has-text("Publier"), button:has-text("Publish")');
    
    // Should redirect to products list
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    
    // Should see success message
    await expect(page.locator('text=/succès|success|créé/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/products/create');
    await page.click('text=/numérique|digital/i');
    
    // Try to submit without filling fields
    await page.click('button:has-text("Suivant"), button:has-text("Next")');
    
    // Should show validation errors
    await expect(page.locator('text=/requis|required/i')).toBeVisible();
  });

  test('should display digital products in list', async ({ page }) => {
    await page.goto('/products');
    
    // Should see products list
    await expect(page.locator('[data-testid="product-card"], .product-card')).toHaveCount({ timeout: 5000 });
  });

  test('should view digital product details', async ({ page }) => {
    await page.goto('/products');
    
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.click();
    
    // Should see product details
    await expect(page.locator('text=/détails|details|description/i')).toBeVisible();
    await expect(page.locator('text=/prix|price/i')).toBeVisible();
  });
});

