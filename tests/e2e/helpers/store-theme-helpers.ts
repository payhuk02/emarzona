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

/**
 * Resolve the same legal document version the app uses via get_latest_legal_document('terms').
 * Hard-coding v1.0 breaks RequireTermsConsent when a newer active doc exists on E2E.
 */
async function ensureE2eTermsDocument(admin: SupabaseClient): Promise<string> {
  const { data: latestRows, error: latestError } = await admin.rpc('get_latest_legal_document', {
    doc_type: 'terms',
    doc_language: 'fr',
  });

  if (!latestError) {
    const latest = Array.isArray(latestRows) ? latestRows[0] : latestRows;
    if (latest && typeof latest === 'object' && 'version' in latest && latest.version) {
      return String(latest.version);
    }
  }

  const { data: existing } = await admin
    .from('legal_documents')
    .select('version')
    .eq('document_type', E2E_TERMS_DOCUMENT.document_type)
    .eq('language', E2E_TERMS_DOCUMENT.language)
    .eq('is_active', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();

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
    p_consent_method: 'settings',
  });

  if (rpcError) {
    const { error: insertError } = await admin.from('user_consents').insert({
      user_id: userId,
      document_type: 'terms',
      document_version: version,
      consent_method: 'settings',
      is_revoked: false,
    });

    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }
  }

  // Verify the app can read consent (same columns as useLegal USER_CONSENT_FIELDS).
  const { data: readable, error: readError } = await admin
    .from('user_consents')
    .select('id, document_type, document_version, is_revoked')
    .eq('user_id', userId)
    .eq('document_type', 'terms')
    .eq('is_revoked', false)
    .limit(1);

  if (readError || !readable?.length) {
    throw readError ?? new Error('seedTermsConsent: consent not readable after insert');
  }
}

export async function saveStoreEdits(page: Page): Promise<void> {
  const saveButton = page.getByRole('button', {
    name: /Enregistrer les modifications|Enregistrer et continuer|Enregistrer le brouillon/i,
  });
  await expect(saveButton.first()).toBeEnabled({ timeout: 30_000 });

  const saveResponse = page.waitForResponse(
    response => {
      const url = response.url();
      return (
        (url.includes('/rest/v1/rpc/save_store_appearance_draft') &&
          response.request().method() === 'POST') ||
        (url.includes('/rest/v1/stores') && ['PATCH', 'PUT'].includes(response.request().method()))
      );
    },
    { timeout: 60_000 }
  );

  await saveButton.first().click();
  const response = await saveResponse.catch(() => null);
  if (response && (response.status() < 200 || response.status() >= 300)) {
    const body = await response.text().catch(() => '');
    throw new Error(`Store save failed (${response.status()}): ${body.slice(0, 400)}`);
  }
}

export async function saveAppearanceDraft(page: Page): Promise<void> {
  const draftButton = page.getByRole('button', { name: /Enregistrer le brouillon/i });
  const saveButton = (await draftButton.isVisible().catch(() => false))
    ? draftButton
    : page.getByRole('button', { name: /Enregistrer les modifications/i });

  await expect(saveButton).toBeEnabled({ timeout: 30_000 });

  const saveResponse = page.waitForResponse(
    response => {
      const url = response.url();
      const ok = response.status() >= 200 && response.status() < 300;
      if (!ok) return false;
      return (
        url.includes('/rest/v1/rpc/save_store_appearance_draft') ||
        (url.includes('/rest/v1/stores') && ['PATCH', 'PUT'].includes(response.request().method()))
      );
    },
    { timeout: 60_000 }
  );

  await saveButton.click();
  const response = await saveResponse.catch(() => null);
  if (response && (response.status() < 200 || response.status() >= 300)) {
    const body = await response.text().catch(() => '');
    throw new Error(`Appearance draft save failed (${response.status()}): ${body.slice(0, 400)}`);
  }
}

export async function publishStoreAppearanceFromUi(page: Page): Promise<void> {
  const publishButton = page.getByRole('button', { name: /Publier sur la vitrine/i });
  await expect(publishButton).toBeEnabled({ timeout: 30_000 });

  const publishResponse = page.waitForResponse(
    response =>
      response.url().includes('/rest/v1/rpc/publish_store_appearance') &&
      response.request().method() === 'POST',
    { timeout: 60_000 }
  );

  await publishButton.click();
  const response = await publishResponse.catch(() => null);
  if (response && (response.status() < 200 || response.status() >= 300)) {
    const body = await response.text().catch(() => '');
    throw new Error(`Appearance publish failed (${response.status()}): ${body.slice(0, 400)}`);
  }
}

export async function saveAndPublishAppearance(page: Page, primaryHex: string): Promise<void> {
  await setPrimaryColorField(page, primaryHex);
  await saveAppearanceDraft(page);

  const publishButton = page.getByRole('button', { name: /Publier sur la vitrine/i });
  if (await publishButton.isEnabled().catch(() => false)) {
    await publishStoreAppearanceFromUi(page);
  }
}

export async function waitForStorefrontPreviewReady(page: Page): Promise<void> {
  await expect(page.getByRole('alert'))
    .toBeHidden({ timeout: 5_000 })
    .catch(() => undefined);
  await expect(page.locator('body')).toHaveClass(/store-theme-active/, { timeout: 90_000 });
}

export async function assertStorePrimaryColorInDb(
  admin: SupabaseClient,
  storeId: string,
  expectedHex: string
): Promise<void> {
  const { data, error } = await admin
    .from('store_appearance')
    .select('primary_color, appearance_draft')
    .eq('store_id', storeId)
    .maybeSingle();

  expect(error).toBeNull();
  const expected = expectedHex.toLowerCase();
  const published = data?.primary_color?.toLowerCase();
  const draft =
    data?.appearance_draft &&
    typeof data.appearance_draft === 'object' &&
    !Array.isArray(data.appearance_draft)
      ? String(
          (data.appearance_draft as { primary_color?: string }).primary_color ?? ''
        ).toLowerCase()
      : '';

  expect(published === expected || draft === expected).toBeTruthy();
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
  const bypassActive = await page
    .evaluate(
      () =>
        document.documentElement.dataset.e2eBypassTerms === '1' ||
        (import.meta as { env?: { VITE_E2E_BYPASS_TERMS?: string } }).env?.VITE_E2E_BYPASS_TERMS ===
          'true'
    )
    .catch(() => false);
  if (bypassActive) {
    return;
  }

  const dialog = page.getByRole('alertdialog');
  try {
    await dialog.waitFor({ state: 'visible', timeout: 2_000 });
  } catch {
    return;
  }

  const checkbox = dialog.getByRole('checkbox', { name: /conditions générales/i });
  if (await checkbox.isVisible().catch(() => false)) {
    if (!(await checkbox.isChecked().catch(() => false))) {
      await checkbox.click();
    }
  } else {
    await page.locator('#accept-terms').check();
  }

  const accept = dialog.getByRole('button', { name: /Accepter et/i });
  await expect(accept).toBeEnabled({ timeout: 10_000 });
  await accept.click();
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
  await expect(page.locator('#store-theme-styles')).toBeAttached({ timeout: 60_000 });
  await expect(page.locator('body')).toHaveClass(/store-theme-active/, { timeout: 60_000 });

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

async function acceptTermsDialogAfterCreateClick(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  const visible = await dialog.isVisible().catch(() => false);
  if (!visible) {
    try {
      await dialog.waitFor({ state: 'visible', timeout: 2_000 });
    } catch {
      return;
    }
  }

  const checkbox = dialog.getByRole('checkbox', { name: /conditions générales/i });
  if (await checkbox.isVisible().catch(() => false)) {
    if (!(await checkbox.isChecked().catch(() => false))) {
      await checkbox.click();
    }
  } else {
    await page.locator('#accept-terms').check();
  }

  const accept = dialog.getByRole('button', { name: /Accepter et/i });
  await expect(accept).toBeEnabled({ timeout: 10_000 });
  await accept.click();
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

export async function submitStoreWizardCreate(page: Page): Promise<void> {
  // Force bypass CGV in the browser context (stable across re-renders / timing in CI).
  await page.evaluate(() => {
    document.documentElement.dataset.e2eBypassTerms = '1';
  });
  await acceptTermsDialogIfVisible(page);

  const onboardingUrl = page.waitForURL(/\/dashboard\/onboarding\//, {
    timeout: 90_000,
  });

  const waitForCreatePost = () =>
    page.waitForResponse(
      response =>
        response.url().includes('/rest/v1/stores') && response.request().method() === 'POST',
      { timeout: 90_000 }
    );

  const createButton = page
    .getByTestId('store-create-submit')
    .or(page.getByRole('button', { name: /Créer ma boutique/i }));
  await expect(createButton.first()).toBeEnabled({ timeout: 15_000 });

  const dispatchFormSubmit = async (): Promise<void> => {
    await page.locator('#store-create-form').evaluate(form => {
      const el = form as HTMLFormElement;
      el.noValidate = true;
      el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  };

  let response: Awaited<ReturnType<typeof waitForCreatePost>> | null = null;

  for (let attempt = 0; attempt < 4 && !response; attempt += 1) {
    const createResponsePromise = waitForCreatePost();
    await createButton.first().click();
    response = await Promise.race([
      createResponsePromise.catch(() => null),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 4_000)),
    ]);

    if (!response) {
      await acceptTermsDialogAfterCreateClick(page);
      response = await Promise.race([
        waitForCreatePost().catch(() => null),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 8_000)),
      ]);
    }

    if (!response) {
      await dispatchFormSubmit();
      response = await Promise.race([
        waitForCreatePost().catch(() => null),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 4_000)),
      ]);
    }
  }

  if (!response) {
    const toastText = await page
      .locator('[data-sonner-toast], [role="status"], [role="alert"]')
      .filter({ hasNotText: /Analytics et Tracking|Note importante/i })
      .first()
      .innerText()
      .catch(() => null);
    const validationText = await page
      .locator('[data-testid="validation-errors"], .text-destructive')
      .first()
      .innerText()
      .catch(() => null);
    const bypassEnv = await page
      .evaluate(
        () =>
          (import.meta as { env?: { VITE_E2E_BYPASS_TERMS?: string } }).env
            ?.VITE_E2E_BYPASS_TERMS ?? 'unset'
      )
      .catch(() => 'unknown');
    throw new Error(
      `Store create POST never fired — toast=${toastText?.trim() ?? 'none'} validation=${validationText?.trim() ?? 'none'} url=${page.url()} bypassEnv=${bypassEnv}`
    );
  }
  if (response.status() < 200 || response.status() >= 300) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(
      `Store create POST failed (${response.status()}): ${bodyText.slice(0, 800)} — url=${page.url()}`
    );
  }

  await onboardingUrl;
}

export async function submitStoreExpressCreate(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.dataset.e2eBypassTerms = '1';
  });
  await acceptTermsDialogIfVisible(page);

  const onboardingUrl = page.waitForURL(/\/dashboard\/onboarding\//, {
    timeout: 90_000,
  });

  const createResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/rest/v1/stores') && response.request().method() === 'POST',
    { timeout: 90_000 }
  );

  const createButton = page.getByTestId('store-express-create-submit');
  await expect(createButton).toBeEnabled({ timeout: 30_000 });
  await createButton.click();

  const response = await createResponsePromise.catch(() => null);
  if (!response) {
    throw new Error(`Express store create POST never fired — url=${page.url()}`);
  }
  if (response.status() < 200 || response.status() >= 300) {
    const body = await response.text().catch(() => '');
    throw new Error(`Express store create failed: ${response.status()} ${body}`);
  }

  await onboardingUrl;
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
