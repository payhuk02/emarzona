/**
 * E2E — palette Cmd+K gated (SidebarNavCommandPalette).
 * Prérequis : session vendeur (auth storage / seed CI).
 */

import { test, expect } from '@playwright/test';

test.describe('CommandPalette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible({ timeout: 15_000 });
  });

  test('should close command palette with Escape', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(commandPalette).not.toBeVisible();
  });

  test('should display search input when opened', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
  });

  test('should show navigation items', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await expect(page.locator('[data-testid="command-palette-item"]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('should filter items when typing', async ({ page }) => {
    await page.keyboard.press('Control+K');
    const searchInput = page.locator('[data-testid="command-palette-input"]');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('zzzz-no-match-emarzona');
    await expect(page.locator('[data-testid="command-palette-no-results"]')).toBeVisible();
  });
});
