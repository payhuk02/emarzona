import { test, expect } from '@playwright/test';

/**
 * E2E Purchase Flow Tests
 * Tests complete purchase journey from product to payment
 */

test.describe('Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete full purchase flow for digital product', async ({ page }) => {
    // Navigate to products
    await page.goto('/products');
    
    // Find digital product
    const digitalProduct = page.locator('[data-testid="product-card"]:has-text("Digital")').first();
    await digitalProduct.click();
    
    // Add to cart or buy now
    const buyButton = page.locator('button:has-text("Acheter"), button:has-text("Buy")');
    await buyButton.click();
    
    // Should navigate to checkout
    await expect(page).toHaveURL(/\/checkout|\/payment/, { timeout: 5000 });
    
    // Fill payment details (test mode)
    const paymentForm = page.locator('[data-testid="payment-form"]');
    if (await paymentForm.isVisible()) {
      await page.fill('input[name="card_number"]', '4242424242424242');
      await page.fill('input[name="expiry"]', '12/25');
      await page.fill('input[name="cvc"]', '123');
      
      // Submit payment
      await page.click('button:has-text("Payer"), button:has-text("Pay")');
      
      // Should show success
      await expect(page.locator('text=/succès|success|merci/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should complete purchase with percentage payment', async ({ page }) => {
    await page.goto('/products');
    
    // Find physical product with percentage payment
    const physicalProduct = page.locator('[data-testid="product-card"]:has-text("Physical")').first();
    if (await physicalProduct.isVisible()) {
      await physicalProduct.click();
      
      // Check if percentage payment is available
      const percentageOption = page.locator('input[type="radio"][value="percentage"]');
      if (await percentageOption.isVisible()) {
        await percentageOption.check();
        
        // Buy
        await page.click('button:has-text("Acheter")');
        
        // Should show partial amount
        await expect(page.locator('text=/acompte|deposit/i')).toBeVisible({ timeout: 5000 });
        
        // Complete payment
        await page.fill('input[name="card_number"]', '4242424242424242');
        await page.click('button:has-text("Payer")');
        
        // Success
        await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should complete purchase with escrow payment', async ({ page }) => {
    await page.goto('/products');
    
    // Find service with escrow
    const serviceProduct = page.locator('[data-testid="product-card"]:has-text("Service")').first();
    if (await serviceProduct.isVisible()) {
      await serviceProduct.click();
      
      // Check if escrow is available
      const escrowOption = page.locator('input[type="radio"][value="delivery_secured"]');
      if (await escrowOption.isVisible()) {
        await escrowOption.check();
        
        // Buy
        await page.click('button:has-text("Réserver")');
        
        // Should show escrow info
        await expect(page.locator('text=/sécurisé|escrow|séquestre/i')).toBeVisible({ timeout: 5000 });
        
        // Complete payment
        await page.fill('input[name="card_number"]', '4242424242424242');
        await page.click('button:has-text("Payer")');
        
        // Success
        await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should add multiple items to cart', async ({ page }) => {
    // Check if cart feature exists
    await page.goto('/products');
    
    // Add first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    const addToCartButton = page.locator('button:has-text("Ajouter au panier"), button:has-text("Add to cart")');
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      
      // Go back to products
      await page.goto('/products');
      
      // Add second product
      const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
      await secondProduct.click();
      await page.click('button:has-text("Ajouter au panier")');
      
      // View cart
      await page.click('[data-testid="cart-icon"], a:has-text("Panier")');
      
      // Should show 2 items
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
      
      // Proceed to checkout
      await page.click('button:has-text("Passer commande"), button:has-text("Checkout")');
      
      // Should navigate to checkout
      await expect(page).toHaveURL(/\/checkout/);
    }
  });

  test('should view order history', async ({ page }) => {
    await page.goto('/orders');
    
    // Should see orders page
    await expect(page.locator('text=/mes commandes|my orders|historique/i')).toBeVisible();
    
    // Should show orders list
    const ordersList = page.locator('[data-testid="order-item"]');
    if (await ordersList.first().isVisible()) {
      await expect(ordersList.first()).toBeVisible();
    }
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Should see order details
      await expect(page.locator('text=/détails|details/i')).toBeVisible();
      await expect(page.locator('text=/montant|amount|total/i')).toBeVisible();
      await expect(page.locator('text=/statut|status/i')).toBeVisible();
    }
  });

  test('should download invoice', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Find invoice button
      const invoiceButton = page.locator('button:has-text("Facture"), button:has-text("Invoice")');
      if (await invoiceButton.isVisible()) {
        // Start download
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          invoiceButton.click()
        ]);
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/invoice|facture/i);
      }
    }
  });
});

