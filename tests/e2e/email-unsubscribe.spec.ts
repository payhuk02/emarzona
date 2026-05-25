/**
 * E2E — page publique de désabonnement email
 */
import { test, expect } from '@playwright/test';
import { mockRecordEmailUnsubscribe } from './helpers/email-mocks';

test.describe('Email — désabonnement public', () => {
  test.beforeEach(async ({ page }) => {
    await mockRecordEmailUnsubscribe(page);
  });

  test('préremplit email et type depuis l’URL', async ({ page }) => {
    await page.goto('/unsubscribe?email=e2e-unsub@emarzona.invalid&type=marketing');

    await expect(page.getByTestId('email-unsubscribe-form')).toBeVisible();
    await expect(page.getByTestId('email-unsubscribe-email')).toHaveValue(
      'e2e-unsub@emarzona.invalid'
    );
  });

  test('confirme le désabonnement marketing', async ({ page }) => {
    await page.goto('/unsubscribe?email=e2e-unsub@emarzona.invalid&type=marketing');

    await page.getByTestId('email-unsubscribe-submit').click();
    await expect(page.getByTestId('email-unsubscribe-success')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Désabonnement confirmé/i)).toBeVisible();
  });
});
