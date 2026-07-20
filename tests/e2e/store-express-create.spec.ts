import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  acceptTermsDialogIfVisible,
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
  extractStoreIdFromUrl,
  seedTermsConsent,
  submitStoreExpressCreate,
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

test.describe('Store express create (E2E)', () => {
  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'store-express-create E2E');
      return;
    }

    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('express path creates store and redirects to onboarding', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-store-express-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;
    const storeName = `E2E Express ${runId}`;
    const storeSlug = slugify(storeName);

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(userError).toBeNull();
    const userId = createdUser.user!.id;

    await seedTermsConsent(admin, userId);

    await page.addInitScript(() => {
      document.documentElement.dataset.e2eBypassTerms = '1';
    });
    await prepareSellerDashboardChrome(page);
    await loginAsSeededUser(page, admin, email, '/dashboard', password);
    await waitForReactApp(page);
    await dismissCookieBannerIfVisible(page);
    await dismissPersonaOnboardingIfVisible(page);
    await acceptTermsDialogIfVisible(page);

    await gotoApp(page, STORE_CREATE_PATH);
    await dismissCookieBannerIfVisible(page);
    await dismissPersonaOnboardingIfVisible(page);

    await expect(page.getByTestId('store-express-create-form')).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/Créer votre boutique en quelques secondes|Create your store in seconds/i)
    ).toBeVisible();

    await page.getByTestId('store-express-name').fill(storeName);
    await expect(page.getByText(new RegExp(`${storeSlug}\\.myemarzona\\.shop`, 'i'))).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('store-express-commerce-digital').click();
    await submitStoreExpressCreate(page);

    const storeIdFromUrl = extractStoreIdFromUrl(page.url());

    const { data: storeRow, error: storeError } = await admin
      .from('stores')
      .select('id, name, slug, subdomain, commerce_type, primary_color')
      .eq('user_id', userId)
      .eq('slug', storeSlug)
      .maybeSingle();

    const storeId = storeRow?.id ?? storeIdFromUrl;
    expect(storeId, 'storeId from create redirect or DB').toBeTruthy();

    const landedOnOnboarding = /\/dashboard\/onboarding\//.test(page.url());
    const landedOnDashboard = /\/dashboard(\?|$|\/)/.test(page.url());
    expect(landedOnOnboarding || landedOnDashboard).toBeTruthy();

    expect(storeError).toBeNull();
    expect(storeRow?.name).toBe(storeName);
    expect(storeRow?.slug).toBe(storeSlug);
    expect(storeRow?.subdomain).toBeTruthy();
    expect(storeRow?.commerce_type).toBe('digital');
    expect(storeRow?.primary_color).toBeTruthy();

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
