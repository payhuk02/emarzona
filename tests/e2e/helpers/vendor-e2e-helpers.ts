import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  acceptTermsDialogIfVisible,
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
  seedTermsConsent,
} from './store-theme-helpers';
import {
  waitForReactApp,
  waitForVendorStoreReady,
  loginAsSeededUser,
} from '../shared/e2e-test-config';
import { retryOnTransientPostgrest } from './supabase-schema-cache-retry';
import { withAuthAdminRetry } from './auth-admin-retry';
import { waitForStoresLoaded, prepareSellerDashboardChrome } from './seller-dashboard-setup';
import { createNodeSupabaseClient } from './create-node-supabase-client';
import { resolveE2ESupabaseUrl } from './e2e-supabase-guard';
import { createClient } from '@supabase/supabase-js';

export type CommerceType = 'artist' | 'digital' | 'course' | 'physical' | 'service';

export type VendorE2EContext = {
  runId: string;
  email: string;
  password: string;
  userId: string;
  storeId: string;
  commerceType: CommerceType;
};

export function slugifyE2E(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function createE2EVendor(
  admin: SupabaseClient,
  commerceType: CommerceType,
  prefix = 'e2e-vendor'
): Promise<VendorE2EContext> {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `${prefix}-${runId}@example.com`;
  const password = `E2E!${runId}aA1`;

  const created = await withAuthAdminRetry(`createE2EVendor(${email})`, async () => {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (result.error || !result.data.user) {
      throw result.error ?? new Error('createUser failed');
    }
    return result.data;
  });

  const userId = created.user!.id;
  await seedTermsConsent(admin, userId);

  const { data: storeData, error: storeError } = await retryOnTransientPostgrest(() =>
    admin
      .from('stores')
      .insert({
        user_id: userId,
        name: `E2E ${commerceType} ${runId}`,
        slug: slugifyE2E(`e2e-${commerceType}-${runId}`),
        description: `E2E ${commerceType} wizard`,
        is_active: true,
        commerce_type: commerceType,
        metadata: { commerce_type: commerceType },
      })
      .select('id')
      .single()
  );

  if (storeError || !storeData) {
    throw storeError ?? new Error('store insert failed');
  }

  return {
    runId,
    email,
    password,
    userId,
    storeId: (storeData as { id: string }).id,
    commerceType,
  };
}

export async function cleanupE2EVendor(
  admin: SupabaseClient,
  ctx: Pick<VendorE2EContext, 'userId' | 'storeId'>,
  productIds: string[] = []
): Promise<void> {
  for (const productId of productIds) {
    try {
      await admin.from('products').delete().eq('id', productId);
    } catch {
      /* best-effort cleanup */
    }
  }
  try {
    await admin.from('stores').delete().eq('id', ctx.storeId);
  } catch {
    /* best-effort cleanup */
  }
  try {
    await admin.auth.admin.deleteUser(ctx.userId);
  } catch {
    /* best-effort cleanup */
  }
}

export async function loginE2EVendor(
  page: Page,
  email: string,
  password: string,
  storeId?: string
): Promise<void> {
  await prepareSellerDashboardChrome(page, { selectedStoreId: storeId });
  const supabaseUrl = resolveE2ESupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    const admin = createNodeSupabaseClient(supabaseUrl, serviceKey);
    await loginAsSeededUser(page, admin, email, '/dashboard');
  } else {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.locator('input[name="email-login"], input[type="email"]').first().fill(email);
    await page.locator('#password-login').fill(password);
    await page
      .locator('form')
      .filter({ has: page.locator('#password-login') })
      .locator('button[type="submit"]')
      .click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  }

  if (storeId) {
    await page.evaluate(id => {
      localStorage.setItem('selectedStoreId', id);
    }, storeId);
  }
  await waitForReactApp(page);
  await waitForVendorStoreReady(page);
  if (storeId) {
    await waitForStoresLoaded(page, { storeId });
  }
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
  await acceptTermsDialogIfVisible(page);
}

/** Injecte une session vendeur valide (signIn API) avant la première navigation Playwright. */
export async function injectVendorAuthSession(
  page: Page,
  email: string,
  password: string,
  storeId: string,
  anonKey: string
): Promise<void> {
  const supabaseUrl = resolveE2ESupabaseUrl();
  if (!supabaseUrl?.trim() || !anonKey.trim()) {
    throw new Error('injectVendorAuthSession requires VITE_SUPABASE_URL and anon key');
  }

  await prepareSellerDashboardChrome(page, { selectedStoreId: storeId });

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw error ?? new Error(`signInWithPassword failed for ${email}`);
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  await page.addInitScript(
    ({ key, session, sid }) => {
      sessionStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem('selectedStoreId', sid);
    },
    { key: storageKey, session: data.session, sid: storeId }
  );
}

/** Attend que la page création produit soit prête (boutique chargée + wizard monté). */
export async function waitForProductCreatePageReady(page: Page): Promise<void> {
  await expect(page.getByText(/Aucune boutique trouvée/i)).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('[data-testid="seller-route-guard-loading"]')).toHaveCount(0, {
    timeout: 30_000,
  });
}

export async function clickWizardNext(page: Page, times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await dismissCookieBannerIfVisible(page);
    // Wizards use aria-label "Étape suivante" / "Aller à l'étape suivante" more often than bare "Suivant".
    await page
      .getByRole('button', { name: /Aller à l'étape suivante|Étape suivante|^Suivant$|^Suiv\.$/i })
      .click({ timeout: 20_000 });
  }
}

export async function goToWizardStep(
  page: Page,
  targetStep: number,
  totalSteps: number
): Promise<void> {
  const stepPattern = new RegExp(`Étape \\d+ sur ${totalSteps}`, 'i');
  for (let guard = 0; guard < totalSteps + 2; guard += 1) {
    const stepText = await page.getByText(stepPattern).first().textContent();
    const match = stepText?.match(new RegExp(`Étape (\\d+) sur ${totalSteps}`, 'i'));
    const current = match ? Number(match[1]) : 1;
    if (current >= targetStep) {
      await expect(
        page.getByText(new RegExp(`Étape ${targetStep} sur ${totalSteps}`, 'i'))
      ).toBeVisible({ timeout: 10_000 });
      return;
    }
    await clickWizardNext(page, 1);
  }
  throw new Error(`Could not reach wizard step ${targetStep}/${totalSteps}`);
}
