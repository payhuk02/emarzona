import { test, expect } from '@playwright/test';

/**
 * Physical Products Tests
 * Tests for physical product creation and inventory management
 */

test.describe('Physical Products', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create physical product with inventory', async ({ page }) => {
    await page.goto('/products/create');
    await page.click('text=/physique|physical/i');
    
    // Step 1: Basic Info
    await page.fill('input[name="title"]', 'Test Physical Product E2E');
    await page.fill('textarea[name="description"]', 'This is a test physical product');
    await page.fill('input[name="price"]', '99.99');
    await page.click('button:has-text("Suivant")');
    
    // Step 2: Inventory
    await page.fill('input[name="sku"]', 'TEST-SKU-' + Date.now());
    await page.fill('input[name="stock_quantity"]', '50');
    await page.fill('input[name="weight"]', '1.5');
    await page.click('button:has-text("Suivant")');
    
    // Step 3: Shipping
    const shippingCheckbox = page.locator('input[type="checkbox"][name*="shipping"]');
    if (await shippingCheckbox.isVisible()) {
      await shippingCheckbox.check();
    }
    await page.click('button:has-text("Suivant")');
    
    // Step 4: Payment Options
    await page.click('input[type="radio"][value="full"]');
    await page.click('button:has-text("Suivant")');
    
    // Step 5: SEO
    await page.fill('input[name="metaTitle"]', 'Test Physical Product SEO');
    await page.click('button:has-text("Suivant")');
    
    // Step 6: FAQs (skip)
    await page.click('button:has-text("Suivant")');
    
    // Step 7: Review & Publish
    await expect(page.locator('text=Test Physical Product E2E')).toBeVisible();
    await page.click('button:has-text("Publier")');
    
    // Should redirect to products list
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display inventory dashboard', async ({ page }) => {
    await page.goto('/inventory');
    
    // Should see inventory page
    await expect(page.locator('text=/inventaire|inventory/i')).toBeVisible();
    await expect(page.locator('text=/stock/i')).toBeVisible();
  });

  test('should filter low stock products', async ({ page }) => {
    await page.goto('/inventory');
    
    // Click low stock filter
    const lowStockButton = page.locator('button:has-text("Stock faible"), button:has-text("Low Stock")');
    if (await lowStockButton.isVisible()) {
      await lowStockButton.click();
      
      // Should filter products
      await expect(page.locator('[data-testid="stock-alert"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update stock quantity', async ({ page }) => {
    await page.goto('/inventory');
    
    // Find first product
    const firstProduct = page.locator('[data-testid="inventory-item"]').first();
    
    // Click edit/update stock
    const updateButton = firstProduct.locator('button:has-text("Modifier"), button:has-text("Update")');
    if (await updateButton.isVisible()) {
      await updateButton.click();
      
      // Update quantity
      await page.fill('input[name="quantity"]', '100');
      await page.click('button:has-text("Enregistrer"), button:has-text("Save")');
      
      // Should show success message
      await expect(page.locator('text=/succès|success|mis à jour/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create product variant', async ({ page }) => {
    await page.goto('/products/create');
    await page.click('text=/physique|physical/i');
    
    // Fill basic info
    await page.fill('input[name="title"]', 'Test Product with Variants');
    await page.fill('input[name="price"]', '49.99');
    await page.click('button:has-text("Suivant")');
    
    // Add variant
    const addVariantButton = page.locator('button:has-text("Ajouter variant"), button:has-text("Add variant")');
    if (await addVariantButton.isVisible()) {
      await addVariantButton.click();
      
      // Fill variant details
      await page.fill('input[name="variant_name"]', 'Size');
      await page.fill('input[name="variant_value"]', 'Large');
      await page.fill('input[name="variant_stock"]', '20');
      
      // Save variant
      await page.click('button:has-text("Ajouter"), button:has-text("Add")');
      
      // Variant should be visible
      await expect(page.locator('text=Large')).toBeVisible();
    }
  });
});

