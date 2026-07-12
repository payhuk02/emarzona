/**
 * E2E Tests for MegaMenuDropdown
 * Tests the mega-menu dropdown functionality with animations, search, and keyboard navigation
 */

import { test, expect } from '@playwright/test';

test.describe('MegaMenuDropdown', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should open mega-menu when clicking on trigger', async ({ page }) => {
    // Find a menu item with hasContext (e.g., Products)
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if mega-menu is visible
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
  });

  test('should close mega-menu when clicking outside', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
    
    // Click outside
    await page.mouse.click(100, 100);
    
    // Check if mega-menu is hidden
    await expect(megaMenu).not.toBeVisible();
  });

  test('should close mega-menu with Escape key', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Check if mega-menu is hidden
    await expect(megaMenu).not.toBeVisible();
  });

  test('should display sections in mega-menu', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if sections are displayed
    const sections = page.locator('[data-testid="mega-menu-section"]');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display items within sections', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if items are displayed
    const items = page.locator('[data-testid="mega-menu-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate keyboard through mega-menu items', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // Check if second item is focused
    const secondItem = page.locator('[data-testid="mega-menu-item"]').nth(1);
    await expect(secondItem).toBeFocused();
  });

  test('should navigate to page when clicking item', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Click on first item
    const firstItem = page.locator('[data-testid="mega-menu-item"]').first();
    const itemUrl = await firstItem.getAttribute('href');
    
    await firstItem.click();
    
    // Check if navigation occurred
    if (itemUrl) {
      await page.waitForURL(itemUrl);
    }
  });

  test('should display search input in mega-menu', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if search input is visible
    const searchInput = page.locator('[data-testid="mega-menu-search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should filter mega-menu items with search', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Type in search
    const searchInput = page.locator('[data-testid="mega-menu-search"]');
    await searchInput.fill('create');
    await page.waitForTimeout(300);
    
    // Check if results are filtered
    const items = page.locator('[data-testid="mega-menu-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display icons for menu items', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if icons are displayed
    const icons = page.locator('[data-testid="mega-menu-item"] svg');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have smooth animations when opening', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    
    // Check if animation class is present
    await expect(megaMenu).toHaveClass(/animate-in/);
  });

  test('should have smooth animations when closing', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    
    // Close mega-menu
    await page.keyboard.press('Escape');
    
    // Check if animation class is present
    await expect(megaMenu).toHaveClass(/animate-out/);
  });

  test('should display section labels', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if section labels are displayed
    const labels = page.locator('[data-testid="mega-menu-section-label"]');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle multiple mega-menu triggers', async ({ page }) => {
    // Find all menu items with hasContext
    const triggers = page.locator('[data-has-context="true"]');
    const count = await triggers.count();
    
    if (count > 1) {
      // Open first mega-menu
      await triggers.first().click();
      const firstMenu = page.locator('[data-testid="mega-menu-dropdown"]');
      await expect(firstMenu).toBeVisible();
      
      // Open second mega-menu (should close first)
      await triggers.nth(1).click();
      await expect(firstMenu).not.toBeVisible();
      
      const secondMenu = page.locator('[data-testid="mega-menu-dropdown"]');
      await expect(secondMenu).toBeVisible();
    }
  });

  test('should display correct content for different domains', async ({ page }) => {
    // Navigate to products page
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if products-specific content is displayed
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
    
    const items = page.locator('[data-testid="mega-menu-item"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if mega-menu is visible and responsive
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
    
    // Check if it has mobile-specific class
    await expect(megaMenu).toHaveClass(/mobile/);
  });

  test('should handle hover states', async ({ page }) => {
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Hover over an item
    const firstItem = page.locator('[data-testid="mega-menu-item"]').first();
    await firstItem.hover();
    
    // Check if hover state is applied
    await expect(firstItem).toHaveClass(/hover/);
  });

  test('should display active state for current page', async ({ page }) => {
    // Navigate to a specific page
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Check if current page item has active state
    const activeItem = page.locator('[data-testid="mega-menu-item"][data-active="true"]');
    await expect(activeItem).toBeVisible();
  });
});

test.describe('MegaMenuDropdown Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    
    // Check ARIA attributes
    await expect(megaMenu).toHaveAttribute('role', 'menu');
  });

  test('should trap focus within mega-menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Press Tab multiple times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should still be within mega-menu
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    const focusedElement = page.locator(':focus');
    const megaMenuBoundingBox = await megaMenu.boundingBox();
    const focusedBoundingBox = await focusedElement.boundingBox();
    
    expect(megaMenuBoundingBox).not.toBeNull();
    expect(focusedBoundingBox).not.toBeNull();
    
    if (megaMenuBoundingBox && focusedBoundingBox) {
      expect(focusedBoundingBox.x).toBeGreaterThanOrEqual(megaMenuBoundingBox.x);
      expect(focusedBoundingBox.y).toBeGreaterThanOrEqual(megaMenuBoundingBox.y);
    }
  });

  test('should return focus to trigger after closing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.focus();
    
    // Open and close mega-menu
    await productsMenuItem.click();
    await page.keyboard.press('Escape');
    
    // Focus should return to the trigger
    await expect(productsMenuItem).toBeFocused();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open mega-menu
    const productsMenuItem = page.locator('[data-has-context="true"]').first();
    await productsMenuItem.click();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    
    // Mega-menu should still be open
    const megaMenu = page.locator('[data-testid="mega-menu-dropdown"]');
    await expect(megaMenu).toBeVisible();
  });
});
