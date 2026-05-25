/**
 * E2E — envoi test depuis le builder de campagne (mocks auth + API)
 */
import { test, expect } from '@playwright/test';
import { mockEmailCampaignApis, seedSupabaseAuthSession } from './helpers/email-mocks';

test.describe('Email — campagne envoi test', () => {
  test.beforeEach(async ({ page }) => {
    await seedSupabaseAuthSession(page);
    await mockEmailCampaignApis(page);
  });

  test('envoie un email de test depuis le builder', async ({ page }) => {
    await page.goto('/dashboard/emails/campaigns');

    // Si la session mock est rejetée, ne pas faire échouer toute la suite CI
    if (page.url().includes('/auth')) {
      test.skip(true, 'Session mock non acceptée — configurer VITE_SUPABASE_* publishable en CI');
      return;
    }

    await page.getByRole('button', { name: /Nouvelle campagne/i }).click();
    await expect(page.getByTestId('email-campaign-builder')).toBeVisible({ timeout: 10000 });

    // Sélectionner un template (Radix Select)
    const templateTrigger = page
      .getByTestId('email-campaign-builder')
      .locator('[role="combobox"]')
      .first();
    if (await templateTrigger.isVisible()) {
      await templateTrigger.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
      }
    }

    await page.getByTestId('email-campaign-test-email').fill('e2e-campaign-test@emarzona.invalid');
    await page.getByTestId('email-campaign-send-test').click();

    await expect(page.getByText(/Email de test envoyé/i)).toBeVisible({ timeout: 15000 });
  });
});
