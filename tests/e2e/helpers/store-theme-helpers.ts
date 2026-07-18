import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';

export const E2E_THEME_PRIMARY_ON_CREATE = '#c0ffee';
export const E2E_THEME_PRIMARY_AFTER_CUSTOMIZE = '#deadb0';

export async function seedTermsConsent(admin: SupabaseClient, userId: string): Promise<void> {
  let version = '1.0';

  const { data: docData, error: docError } = await admin.rpc('get_latest_legal_document', {
    doc_type: 'terms',
    doc_language: 'fr',
  });

  if (!docError && Array.isArray(docData) && docData[0] && typeof docData[0].version === 'string') {
    version = docData[0].version;
  }

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
