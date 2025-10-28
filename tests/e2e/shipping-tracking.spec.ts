import { test, expect } from '@playwright/test';

/**
 * Shipping & Tracking Tests
 * Tests for shipping integration and order tracking
 */

test.describe('Shipping & Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should calculate shipping rates', async ({ page }) => {
    await page.goto('/products');
    
    // Find physical product
    const physicalProduct = page.locator('[data-testid="product-card"]:has-text("Physical")').first();
    if (await physicalProduct.isVisible()) {
      await physicalProduct.click();
      
      // Click buy/checkout
      await page.click('button:has-text("Acheter")');
      
      // Fill shipping address
      await page.fill('input[name="address"]', '123 Test Street');
      await page.fill('input[name="city"]', 'Paris');
      await page.fill('input[name="postal_code"]', '75001');
      
      // Calculate shipping
      const calculateButton = page.locator('button:has-text("Calculer"), button:has-text("Calculate")');
      if (await calculateButton.isVisible()) {
        await calculateButton.click();
        
        // Should show shipping options
        await expect(page.locator('[data-testid="shipping-option"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should select shipping method', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should see shipping methods
    const shippingOptions = page.locator('[data-testid="shipping-option"]');
    if (await shippingOptions.first().isVisible()) {
      // Select first option
      await shippingOptions.first().click();
      
      // Should highlight selected option
      await expect(shippingOptions.first()).toHaveClass(/selected|active/);
    }
  });

  test('should create shipping label', async ({ page }) => {
    await page.goto('/orders');
    
    // Find pending order
    const pendingOrder = page.locator('[data-testid="order-item"]:has-text("En attente")').first();
    if (await pendingOrder.isVisible()) {
      await pendingOrder.click();
      
      // Click create label
      const createLabelButton = page.locator('button:has-text("Créer étiquette"), button:has-text("Create label")');
      if (await createLabelButton.isVisible()) {
        await createLabelButton.click();
        
        // Should show success
        await expect(page.locator('text=/étiquette créée|label created/i')).toBeVisible({ timeout: 10000 });
        
        // Should show tracking number
        await expect(page.locator('[data-testid="tracking-number"]')).toBeVisible();
      }
    }
  });

  test('should track shipment', async ({ page }) => {
    await page.goto('/orders');
    
    // Find shipped order
    const shippedOrder = page.locator('[data-testid="order-item"]:has-text("Expédié")').first();
    if (await shippedOrder.isVisible()) {
      await shippedOrder.click();
      
      // Click track button
      const trackButton = page.locator('button:has-text("Suivre"), button:has-text("Track")');
      if (await trackButton.isVisible()) {
        await trackButton.click();
        
        // Should show tracking info
        await expect(page.locator('[data-testid="tracking-info"]')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=/statut|status/i')).toBeVisible();
      }
    }
  });

  test('should display tracking timeline', async ({ page }) => {
    await page.goto('/orders');
    
    // Find order with tracking
    const trackedOrder = page.locator('[data-testid="order-item"]').first();
    if (await trackedOrder.isVisible()) {
      await trackedOrder.click();
      
      // Should see tracking timeline
      const timeline = page.locator('[data-testid="tracking-timeline"]');
      if (await timeline.isVisible()) {
        // Should have tracking events
        await expect(timeline.locator('[data-testid="tracking-event"]').first()).toBeVisible();
      }
    }
  });

  test('should download shipping label PDF', async ({ page }) => {
    await page.goto('/orders');
    
    // Find order with label
    const orderWithLabel = page.locator('[data-testid="order-item"]').first();
    if (await orderWithLabel.isVisible()) {
      await orderWithLabel.click();
      
      // Find download label button
      const downloadButton = page.locator('button:has-text("Télécharger étiquette"), button:has-text("Download label")');
      if (await downloadButton.isVisible()) {
        // Start download
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.click()
        ]);
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/label|etiquette/i);
      }
    }
  });

  test('should handle shipping exceptions', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try invalid address
    await page.fill('input[name="address"]', 'Invalid Address 123456');
    await page.fill('input[name="city"]', 'InvalidCity');
    await page.fill('input[name="postal_code"]', '00000');
    
    const calculateButton = page.locator('button:has-text("Calculer")');
    if (await calculateButton.isVisible()) {
      await calculateButton.click();
      
      // Should show error
      await expect(page.locator('text=/erreur|error|invalide/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update delivery status', async ({ page }) => {
    await page.goto('/orders');
    
    // Find order as vendor/admin
    const order = page.locator('[data-testid="order-item"]').first();
    if (await order.isVisible()) {
      await order.click();
      
      // Update status
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('delivered');
        
        // Save
        await page.click('button:has-text("Enregistrer"), button:has-text("Save")');
        
        // Should show success
        await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

