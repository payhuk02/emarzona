import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  acceptTermsDialogIfVisible,
  assertStorefrontThemePrimary,
  clickWizardNext,
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
  E2E_THEME_PRIMARY_AFTER_CUSTOMIZE,
  E2E_THEME_PRIMARY_ON_CREATE,
  extractStoreIdFromUrl,
  seedTermsConsent,
  setPrimaryColorField,
  submitStoreWizardCreate,
} from './helpers/store-theme-helpers';
import { prepareSellerDashboardChrome } from './helpers/seller-dashboard-setup';
import { gotoApp, loginAsSeededUser, waitForReactApp } from './shared/e2e-test-config';
import { STORE_CREATE_PATH } from '../../src/lib/store/store-create-path';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Store create → customize → storefront theme (E2E)', () => {
  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'store-create-theme E2E');
      return;
    }

    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('wizard create with theme, dashboard customize, preview CSS variables', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-store-theme-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;
    const storeName = `E2E Theme ${runId}`;
    const storeSlug = slugify(storeName);

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(userError).toBeNull();
    const userId = createdUser.user!.id;

    await seedTermsConsent(admin, userId);

    await prepareSellerDashboardChrome(page);
    await page.addInitScript(() => {
      document.documentElement.dataset.e2eBypassTerms = '1';
    });
    await loginAsSeededUser(page, admin, email, '/dashboard', password);
    await waitForReactApp(page);
    await dismissCookieBannerIfVisible(page);
    await dismissPersonaOnboardingIfVisible(page);
    await acceptTermsDialogIfVisible(page);

    await gotoApp(page, STORE_CREATE_PATH);
    await dismissCookieBannerIfVisible(page);
    await dismissPersonaOnboardingIfVisible(page);
    await expect(page.getByText(/Étape 1 sur 8/i)).toBeVisible({ timeout: 60_000 });

    await page.locator('#commerce_type').click();
    await page.getByRole('option', { name: 'Produits digitaux' }).click();

    await page.locator('#name').fill(storeName);
    await expect(page.locator('#slug')).toHaveValue(storeSlug, { timeout: 10_000 });
    await expect(page.locator('label[for="slug"] svg.text-accent')).toBeVisible({
      timeout: 45_000,
    });

    await clickWizardNext(page, 3);
    await expect(page.getByText(/Étape 4 sur 8/i)).toBeVisible();
    await setPrimaryColorField(page, E2E_THEME_PRIMARY_ON_CREATE);

    await clickWizardNext(page, 4);
    await expect(page.getByText(/Étape 8 sur 8/i)).toBeVisible();

    await submitStoreWizardCreate(page);

    await expect(page)
      .toHaveURL(/\/dashboard\/onboarding\/store\?storeId=/, {
        timeout: 90_000,
      })
      .catch(async error => {
        const toastText = await page
          .locator('[role="status"], [role="alert"]')
          .first()
          .innerText()
          .catch(() => null);
        throw new Error(
          `${String(error)}${toastText ? ` — toast: ${toastText.trim()}` : ''} — url=${page.url()}`
        );
      });

    const storeId = extractStoreIdFromUrl(page.url());
    expect(storeId, 'storeId from onboarding redirect').toBeTruthy();

    await gotoApp(page, `/dashboard/store/preview?storeId=${encodeURIComponent(storeId!)}`);
    await assertStorefrontThemePrimary(page, E2E_THEME_PRIMARY_ON_CREATE);

    await gotoApp(page, '/dashboard/store');
    await page.getByRole('button', { name: /Modifier la boutique/i }).click();
    await page.getByRole('tab', { name: /Étape 2: Apparence/i }).click();
    await setPrimaryColorField(page, E2E_THEME_PRIMARY_AFTER_CUSTOMIZE);
    await page.getByRole('button', { name: /^Enregistrer$/i }).click();
    await expect(page.getByRole('button', { name: /Modifier la boutique/i })).toBeVisible({
      timeout: 30_000,
    });

    await gotoApp(page, `/dashboard/store/preview?storeId=${encodeURIComponent(storeId!)}`);
    await assertStorefrontThemePrimary(page, E2E_THEME_PRIMARY_AFTER_CUSTOMIZE);

    try {
      await admin.from('stores').delete().eq('id', storeId!);
    } catch (error) {
      testInfo.attach('cleanup-store-error', { body: String(error), contentType: 'text/plain' });
    }
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch (error) {
      testInfo.attach('cleanup-user-error', { body: String(error), contentType: 'text/plain' });
    }
  });
});
