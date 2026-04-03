import { test, expect } from '@playwright/test';

/**
 * Messaging & Advanced Payments Tests
 * Tests for order messaging and escrow payments
 */

test.describe('Messaging & Payments', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should send message in order conversation', async ({ page }) => {
    await page.goto('/orders');
    
    // Click on first order
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Click messaging button
      const messageButton = page.locator('button:has-text("Messagerie"), button:has-text("Messages")');
      if (await messageButton.isVisible()) {
        await messageButton.click();
        
        // Should show conversation
        await expect(page.locator('[data-testid="conversation"]')).toBeVisible({ timeout: 5000 });
        
        // Send message
        await page.fill('textarea[name="message"]', 'Hello, this is a test message from E2E test');
        await page.click('button:has-text("Envoyer"), button:has-text("Send")');
        
        // Should see message in conversation
        await expect(page.locator('text=Hello, this is a test message')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should upload media in conversation', async ({ page }) => {
    await page.goto('/orders');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      const messageButton = page.locator('button:has-text("Messagerie")');
      if (await messageButton.isVisible()) {
        await messageButton.click();
        
        // Find file upload
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Create test file
          await fileInput.setInputFiles({
            name: 'test-image.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
          });
          
          // Should show upload success
          await expect(page.locator('text=/téléchargé|uploaded/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should view payment management page', async ({ page }) => {
    await page.goto('/orders');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Click payment management
      const paymentButton = page.locator('button:has-text("Gérer Paiements"), button:has-text("Manage Payments")');
      if (await paymentButton.isVisible()) {
        await paymentButton.click();
        
        // Should see payment details
        await expect(page.locator('text=/paiement|payment/i')).toBeVisible();
        await expect(page.locator('text=/montant|amount/i')).toBeVisible();
      }
    }
  });

  test('should release escrow payment', async ({ page }) => {
    await page.goto('/orders');
    
    // Find order with escrow
    const escrowOrder = page.locator('[data-testid="order-item"]:has-text("Séquestre")').first();
    if (await escrowOrder.isVisible()) {
      await escrowOrder.click();
      
      // Open payment management
      await page.click('button:has-text("Gérer Paiements")');
      
      // Release payment
      const releaseButton = page.locator('button:has-text("Libérer"), button:has-text("Release")');
      if (await releaseButton.isVisible()) {
        await releaseButton.click();
        
        // Confirm
        await page.click('button:has-text("Confirmer")');
        
        // Should show success
        await expect(page.locator('text=/libéré|released/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should open dispute', async ({ page }) => {
    await page.goto('/orders');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      
      // Click open dispute
      const disputeButton = page.locator('button:has-text("Ouvrir litige"), button:has-text("Open dispute")');
      if (await disputeButton.isVisible()) {
        await disputeButton.click();
        
        // Fill dispute form
        await page.fill('textarea[name="reason"]', 'Product not as described - E2E test dispute');
        
        // Select category
        const categorySelect = page.locator('select[name="category"]');
        if (await categorySelect.isVisible()) {
          await categorySelect.selectOption({ index: 1 });
        }
        
        // Submit dispute
        await page.click('button:has-text("Soumettre"), button:has-text("Submit")');
        
        // Should show success
        await expect(page.locator('text=/litige ouvert|dispute opened/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should view dispute details', async ({ page }) => {
    await page.goto('/disputes');
    
    // Should see disputes list
    const dispute = page.locator('[data-testid="dispute-item"]').first();
    if (await dispute.isVisible()) {
      await dispute.click();
      
      // Should see dispute details
      await expect(page.locator('text=/détails du litige|dispute details/i')).toBeVisible();
      await expect(page.locator('text=/raison|reason/i')).toBeVisible();
    }
  });

  test('should respond to dispute', async ({ page }) => {
    await page.goto('/disputes');
    
    const dispute = page.locator('[data-testid="dispute-item"]').first();
    if (await dispute.isVisible()) {
      await dispute.click();
      
      // Add response
      const responseTextarea = page.locator('textarea[name="response"]');
      if (await responseTextarea.isVisible()) {
        await responseTextarea.fill('This is a test response to the dispute');
        await page.click('button:has-text("Répondre"), button:has-text("Reply")');
        
        // Should see response
        await expect(page.locator('text=This is a test response')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should process second payment installment', async ({ page }) => {
    await page.goto('/orders');
    
    // Find order with percentage payment
    const percentageOrder = page.locator('[data-testid="order-item"]:has-text("Acompte")').first();
    if (await percentageOrder.isVisible()) {
      await percentageOrder.click();
      
      // Open payment management
      await page.click('button:has-text("Gérer Paiements")');
      
      // Pay remaining amount
      const payRemainingButton = page.locator('button:has-text("Payer le reste"), button:has-text("Pay remaining")');
      if (await payRemainingButton.isVisible()) {
        await payRemainingButton.click();
        
        // Enter payment details
        await page.fill('input[name="card_number"]', '4242424242424242');
        await page.click('button:has-text("Payer")');
        
        // Should show success
        await expect(page.locator('text=/paiement complet|payment complete/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

