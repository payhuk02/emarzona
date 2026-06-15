/**
 * Epic 6 — E2E DPA + fraud contract
 */
import { test, expect } from '@playwright/test';
import { gotoApp } from './shared/e2e-test-config';

test.describe('Moon 6 — Enterprise compliance', () => {
  test('page DPA /legal/dpa charge', async ({ page }) => {
    const response = await gotoApp(page, '/legal/dpa');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { name: /accord de traitement/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
