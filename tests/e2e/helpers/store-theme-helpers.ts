import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';

export const E2E_THEME_PRIMARY_ON_CREATE = '#c0ffee';
export const E2E_THEME_PRIMARY_AFTER_CUSTOMIZE = '#deadb0';

const E2E_TERMS_DOCUMENT = {
  document_type: 'terms-of-service',
  version: '1.0',
  language: 'fr',
  title: 'Conditions Générales de Vente E2E',
  content: 'Contenu CGV minimal pour les tests E2E commerce.',
  effective_date: new Date().toISOString(),
  is_active: true,
} as const;

async function ensureE2eTermsDocument(admin: SupabaseClient): Promise<string> {
  const { data: existing, error: existingError } = await admin
    .from('legal_documents')
    .select('version')
    .eq('document_type', E2E_TERMS_DOCUMENT.document_type)
    .eq('language', E2E_TERMS_DOCUMENT.language)
    .eq('version', E2E_TERMS_DOCUMENT.version)
    .eq('is_active', true)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }
  if (existing?.version) {
    return existing.version;
  }

  const { error: insertError } = await admin.from('legal_documents').insert(E2E_TERMS_DOCUMENT);
  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }

  return E2E_TERMS_DOCUMENT.version;
}

export async function seedTermsConsent(admin: SupabaseClient, userId: string): Promise<void> {
  const version = await ensureE2eTermsDocument(admin);

  const { error: rpcError } = await admin.rpc('record_user_consent', {
    p_user_id: userId,
    p_document_type: 'terms',
    p_document_version: version,
    p_consent_method: 'e2e',
  });

  if (!rpcError) {
    return;
  }

  const { error: insertError } = await admin.from('user_consents').insert({
    user_id: userId,
    document_type: 'terms',
    document_version: version,
    is_revoked: false,
  });

  // Ignore duplicate consent rows on re-runs.
  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }
}

export async function dismissPersonaOnboardingIfVisible(page: Page): Promise<void> {
  const dismiss = page.getByRole('button', { name: /^Compris$/i });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
    await expect(dismiss)
      .toBeHidden({ timeout: 10_000 })
      .catch(() => undefined);
  }
}

export async function dismissCookieBannerIfVisible(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.cookie = 'emarzona_consent=true; path=/; max-age=31536000; SameSite=Lax';
    localStorage.setItem('cookieConsentGiven', 'true');
  });

  const acceptAll = page.getByRole('button', { name: /Tout accepter/i });
  if (await acceptAll.isVisible().catch(() => false)) {
    await acceptAll.click();
    await expect(page.getByText(/Nous utilisons des cookies/i))
      .toBeHidden({ timeout: 5_000 })
      .catch(() => undefined);
  }
}

export async function acceptTermsDialogIfVisible(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  try {
    await dialog.waitFor({ state: 'visible', timeout: 8_000 });
  } catch {
    return;
  }

  await page.locator('#accept-terms').check();
  await page.getByRole('button', { name: /Accepter et/i }).click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

export async function setPrimaryColorField(page: Page, hex: string): Promise<void> {
  const textInput = page.locator('#primary_color ~ input[type="text"]');
  await textInput.fill(hex);
  await textInput.blur();
}

export async function clickWizardNext(page: Page, times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await dismissCookieBannerIfVisible(page);
    await page.getByRole('button', { name: /^Suivant$/i }).click();
  }
}

export async function assertStorefrontThemePrimary(page: Page, expectedHex: string): Promise<void> {
  await expect(page.locator('body')).toHaveClass(/store-theme-active/);
  await expect(page.locator('#store-theme-styles')).toBeAttached();

  const cssText = await page.locator('#store-theme-styles').textContent();
  expect(cssText ?? '').toContain(`--store-primary: ${expectedHex}`);

  const cssVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--store-primary')
      .trim()
      .toLowerCase()
  );
  expect(cssVar).toBe(expectedHex.toLowerCase());
}

export function extractStoreIdFromUrl(url: string): string | null {
  try {
    return new URL(url).searchParams.get('storeId');
  } catch {
    return null;
  }
}

export async function submitStoreWizardCreate(page: Page): Promise<void> {
  await acceptTermsDialogIfVisible(page);

  const createResponse = page.waitForResponse(
    response =>
      response.url().includes('/rest/v1/stores') &&
      response.request().method() === 'POST' &&
      response.status() >= 200 &&
      response.status() < 300,
    { timeout: 90_000 }
  );

  await page.getByRole('button', { name: /Créer ma boutique/i }).click();
  await acceptTermsDialogIfVisible(page);

  const response = await createResponse;
  const bodyText = await response.text().catch(() => '');
  if (response.status() >= 400) {
    throw new Error(`Store create POST failed (${response.status()}): ${bodyText.slice(0, 500)}`);
  }
}

export async function expectDestructiveToast(page: Page): Promise<string | null> {
  const toast = page.locator('[role="status"], [role="alert"]').filter({
    hasText: /erreur|error|validation|invalid/i,
  });
  if (
    await toast
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return toast.first().innerText();
  }
  return null;
}
