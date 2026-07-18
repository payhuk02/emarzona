import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';

export const E2E_THEME_PRIMARY_ON_CREATE = '#c0ffee';
export const E2E_THEME_PRIMARY_AFTER_CUSTOMIZE = '#deadb0';

export async function seedTermsConsent(admin: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await admin.rpc('get_latest_legal_document', {
    doc_type: 'terms',
    doc_language: 'fr',
  });

  if (error) {
    throw error;
  }

  const version =
    (Array.isArray(data) && data[0] && typeof data[0].version === 'string'
      ? data[0].version
      : null) ?? '1.0.0';

  const { error: consentError } = await admin.rpc('record_user_consent', {
    p_user_id: userId,
    p_document_type: 'terms',
    p_document_version: version,
    p_consent_method: 'e2e',
  });

  if (consentError) {
    throw consentError;
  }
}

export async function acceptTermsDialogIfVisible(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  const visible = await dialog.isVisible().catch(() => false);
  if (!visible) {
    return;
  }

  await page.locator('#accept-terms').click();
  await page.getByRole('button', { name: /Accepter et/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

export async function setPrimaryColorField(page: Page, hex: string): Promise<void> {
  const textInput = page.locator('#primary_color ~ input[type="text"]');
  await textInput.fill(hex);
  await textInput.blur();
}

export async function clickWizardNext(page: Page, times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
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
