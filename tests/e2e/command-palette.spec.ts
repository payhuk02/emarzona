/**
 * E2E Tests for CommandPalette
 * Tests the Cmd+K command palette functionality with fuzzy search, keyboard navigation, and recent pages
 */

import { test, expect } from '@playwright/test';

test.describe('CommandPalette', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    // Press Cmd+K (or Ctrl+K on Windows)
    await page.keyboard.press('Meta+K');
    
    // Check if command palette is visible
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();
  });

  test('should open command palette with Ctrl+K on Windows', async ({ page }) => {
    // Press Ctrl+K
    await page.keyboard.press('Control+K');
    
    // Check if command palette is visible
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();
  });

  test('should close command palette with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Check if command palette is hidden
    await expect(commandPalette).not.toBeVisible();
  });

  test('should display search input when opened', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Check if search input is visible and focused
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test('should filter commands with fuzzy search', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('orders');
    
    // Wait for results to filter
    await page.waitForTimeout(300);
    
    // Check if filtered results are displayed
    const results = page.locator('[data-testid="command-palette-item"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    
    // Check if results contain the search term
    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('orders');
    }
  });

  test('should navigate keyboard through results with arrow keys', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('dashboard');
    await page.waitForTimeout(300);
    
    // Navigate down with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // Check if second item is focused
    const secondItem = page.locator('[data-testid="command-palette-item"]').nth(1);
    await expect(secondItem).toHaveClass(/focused/);
  });

  test('should select and navigate to result with Enter', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('orders');
    await page.waitForTimeout(300);
    
    // Navigate to first result
    await page.keyboard.press('ArrowDown');
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    
    // Check if navigation occurred
    await page.waitForURL(/\/dashboard\/orders/);
  });

  test('should display recent pages section', async ({ page }) => {
    // First, visit some pages to populate recent pages
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Check if recent pages section is visible
    const recentSection = page.locator('[data-testid="command-palette-recent"]');
    await expect(recentSection).toBeVisible();
  });

  test('should display category labels for results', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('products');
    await page.waitForTimeout(300);
    
    // Check if category labels are displayed
    const categoryLabels = page.locator('[data-testid="command-palette-category"]');
    const count = await categoryLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should clear search input with backspace', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('test search');
    
    // Clear with backspace
    await page.keyboard.press('BackSpace');
    await page.keyboard.press('BackSpace');
    await page.keyboard.press('BackSpace');
    await page.keyboard.press('BackSpace');
    await page.keyboard.press('BackSpace');
    
    // Check if input is cleared
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('should display no results message for empty search', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type non-existent search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('xyz123nonexistent');
    await page.waitForTimeout(300);
    
    // Check if no results message is displayed
    const noResults = page.locator('[data-testid="command-palette-no-results"]');
    await expect(noResults).toBeVisible();
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Test Ctrl+P for previous (if implemented)
    // Test Ctrl+N for next (if implemented)
    // Test Ctrl+U to clear (if implemented)
    
    // For now, test basic navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Should still be open
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();
  });

  test('should close when clicking outside', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Click outside the command palette
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await page.mouse.click(100, 100);
    
    // Check if command palette is hidden
    await expect(commandPalette).not.toBeVisible();
  });

  test('should persist recent pages in localStorage', async ({ page, context }) => {
    // Visit some pages
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    
    // Check localStorage
    const recentPages = await page.evaluate(() => {
      const data = localStorage.getItem('command-palette-recent');
      return data ? JSON.parse(data) : [];
    });
    
    expect(recentPages.length).toBeGreaterThan(0);
  });

  test('should display icons for command items', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await searchInput.fill('dashboard');
    await page.waitForTimeout(300);
    
    // Check if icons are displayed
    const icons = page.locator('[data-testid="command-palette-item"] svg');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('CommandPalette Accessibility', () => {
  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Meta+K');
    
    const commandPalette = page.locator('[data-testid="command-palette"]');
    
    // Check ARIA attributes
    await expect(commandPalette).toHaveAttribute('role', 'dialog');
    await expect(commandPalette).toHaveAttribute('aria-modal', 'true');
  });

  test('should trap focus within command palette', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Meta+K');
    
    // Press Tab multiple times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should still be within command palette
    const commandPalette = page.locator('[data-testid="command-palette"]');
    const focusedElement = page.locator(':focus');
    const isInside = await commandPalette.contains(focusedElement);
    expect(isInside).toBe(true);
  });

  test('should return focus to trigger after closing', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Focus on a button before opening
    const someButton = page.locator('button').first();
    await someButton.focus();
    
    // Open and close command palette
    await page.keyboard.press('Meta+K');
    await page.keyboard.press('Escape');
    
    // Focus should return to the button
    await expect(someButton).toBeFocused();
  });
});
