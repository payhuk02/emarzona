import { test, expect } from '@playwright/test';

/**
 * Service Products Tests
 * Tests for service product creation and booking management
 */

test.describe('Service Products', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create service product', async ({ page }) => {
    await page.goto('/products/create');
    await page.click('text=/service/i');
    
    // Step 1: Basic Info
    await page.fill('input[name="title"]', 'Test Service E2E');
    await page.fill('textarea[name="description"]', 'Professional consulting service');
    await page.fill('input[name="price"]', '150.00');
    await page.click('button:has-text("Suivant")');
    
    // Step 2: Service Details
    await page.fill('input[name="duration"]', '60');
    
    // Select service type if exists
    const serviceTypeSelect = page.locator('select[name="service_type"]');
    if (await serviceTypeSelect.isVisible()) {
      await serviceTypeSelect.selectOption('consultation');
    }
    
    await page.click('button:has-text("Suivant")');
    
    // Step 3: Availability
    // Configure available days
    const mondayCheckbox = page.locator('input[type="checkbox"][value="monday"]');
    if (await mondayCheckbox.isVisible()) {
      await mondayCheckbox.check();
    }
    
    await page.click('button:has-text("Suivant")');
    
    // Step 4: Staff (skip if optional)
    await page.click('button:has-text("Suivant")');
    
    // Step 5: Payment Options
    await page.click('input[type="radio"][value="full"]');
    await page.click('button:has-text("Suivant")');
    
    // Step 6: SEO
    await page.fill('input[name="metaTitle"]', 'Test Service SEO');
    await page.click('button:has-text("Suivant")');
    
    // Step 7: FAQs (skip)
    await page.click('button:has-text("Suivant")');
    
    // Step 8: Review & Publish
    await expect(page.locator('text=Test Service E2E')).toBeVisible();
    await page.click('button:has-text("Publier")');
    
    // Should redirect to products list
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    await expect(page.locator('text=/succès|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should view service calendar', async ({ page }) => {
    await page.goto('/services/calendar');
    
    // Should see calendar
    await expect(page.locator('.rbc-calendar, [data-testid="calendar"]')).toBeVisible({ timeout: 5000 });
  });

  test('should create service booking', async ({ page }) => {
    // Navigate to services
    await page.goto('/products');
    
    // Filter for services
    const serviceFilter = page.locator('button:has-text("Services")');
    if (await serviceFilter.isVisible()) {
      await serviceFilter.click();
    }
    
    // Click on first service
    const firstService = page.locator('[data-testid="product-card"]').first();
    if (await firstService.isVisible()) {
      await firstService.click();
      
      // Click book button
      const bookButton = page.locator('button:has-text("Réserver"), button:has-text("Book")');
      if (await bookButton.isVisible()) {
        await bookButton.click();
        
        // Select date and time
        await page.click('[data-testid="date-picker"]');
        await page.click('[data-testid="time-slot"]');
        
        // Confirm booking
        await page.click('button:has-text("Confirmer")');
        
        // Should show success
        await expect(page.locator('text=/réservation confirmée|booking confirmed/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display bookings list', async ({ page }) => {
    await page.goto('/bookings');
    
    // Should see bookings page
    await expect(page.locator('text=/réservations|bookings/i')).toBeVisible();
  });

  test('should cancel booking', async ({ page }) => {
    await page.goto('/bookings');
    
    // Find first booking
    const firstBooking = page.locator('[data-testid="booking-item"]').first();
    
    if (await firstBooking.isVisible()) {
      // Click cancel button
      const cancelButton = firstBooking.locator('button:has-text("Annuler"), button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Confirm cancellation
        await page.click('button:has-text("Confirmer")');
        
        // Should show success
        await expect(page.locator('text=/annulée|cancelled/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

