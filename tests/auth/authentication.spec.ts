import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests for login, logout, and registration flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Payhula/);
    await expect(page.locator('text=Payhula')).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.click('text=Se connecter');
    await expect(page).toHaveURL('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/invalid|incorrect|erreur/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in credentials (using test account)
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Should see dashboard elements
    await expect(page.locator('text=/tableau de bord|dashboard/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Click logout button
    await page.click('text=/déconnexion|logout/i');
    
    // Should redirect to landing or auth page
    await expect(page).toHaveURL(/\/|\/auth/);
  });

  test('should toggle between login and register', async ({ page }) => {
    await page.goto('/auth');
    
    // Check if register toggle exists
    const registerLink = page.locator('text=/créer un compte|register|inscription/i');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      
      // Should show additional fields for registration
      await expect(page.locator('input[name="name"], input[placeholder*="nom"]')).toBeVisible();
    }
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=/tableau de bord|dashboard/i')).toBeVisible();
  });

  test('should redirect to auth when accessing protected route', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/products');
    
    // Should redirect to auth
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });
});

