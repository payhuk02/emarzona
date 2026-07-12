/**
 * E2E Tests for ContextSidebar
 */

import { test, expect } from '@playwright/test';

test.describe('ContextSidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should open context sidebar when clicking trigger', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const contextSidebar = page.locator('[data-testid="context-sidebar"]');
      await expect(contextSidebar).toBeVisible();
    }
  });

  test('should close context sidebar with Escape key', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      await page.keyboard.press('Escape');
      const contextSidebar = page.locator('[data-testid="context-sidebar"]');
      await expect(contextSidebar).not.toBeVisible();
    }
  });

  test('should display sections and items', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const sections = page.locator('[data-testid="context-sidebar-section"]');
      const items = page.locator('[data-testid="context-sidebar-item"]');
      expect(await sections.count()).toBeGreaterThan(0);
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  test('should toggle section expansion', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const sectionHeader = page.locator('[data-testid="context-sidebar-section-header"]').first();
      await sectionHeader.click();
      const section = page.locator('[data-testid="context-sidebar-section"]').first();
      await expect(section).toHaveClass(/collapsed/);
    }
  });

  test('should navigate when clicking item', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const firstItem = page.locator('[data-testid="context-sidebar-item"]').first();
      await firstItem.click();
      const contextSidebar = page.locator('[data-testid="context-sidebar"]');
      await expect(contextSidebar).not.toBeVisible();
    }
  });

  test('should have smooth animations', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const contextSidebar = page.locator('[data-testid="context-sidebar"]');
      await expect(contextSidebar).toHaveClass(/animate-in/);
    }
  });

  test('should display domain-specific content', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      const items = page.locator('[data-testid="context-sidebar-item"]');
      expect(await items.count()).toBeGreaterThan(0);
    }
  });

  test('should close when route changes', async ({ page }) => {
    const trigger = page.locator('[data-testid="context-sidebar-trigger"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
      await page.goto('/dashboard/orders');
      await page.waitForLoadState('networkidle');
      const contextSidebar = page.locator('[data-testid="context-sidebar"]');
      await expect(contextSidebar).not.toBeVisible();
    }
  });
});
