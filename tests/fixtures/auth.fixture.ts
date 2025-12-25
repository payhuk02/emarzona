import { test as base } from '@playwright/test';

/**
 * Authentication Fixtures
 * Provides authenticated user context for tests
 */

export const test = base.extend({
  // Authenticated user fixture
  authenticatedPage: async ({ page }, useFn) => {
    // Navigate to login page
    await page.goto('/auth');
    
    // Fill in test credentials
    await page.fill('input[type="email"]', 'test@payhula.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Use the authenticated page (Playwright fixture pattern, not React Hook)
    // The parameter name 'useFn' avoids React Hook naming conflict
    await useFn(page);
  },
});

export { expect } from '@playwright/test';

