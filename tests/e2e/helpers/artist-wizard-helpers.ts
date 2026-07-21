import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  acceptTermsDialogIfVisible,
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
  seedTermsConsent,
} from './store-theme-helpers';
import { waitForReactApp } from '../shared/e2e-test-config';

/** 1×1 PNG valide pour upload catalogue. */
export const E2E_ARTWORK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

export function slugifyArtistE2E(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export type ArtistE2EVendorContext = {
  runId: string;
  email: string;
  password: string;
  userId: string;
  storeId: string;
};

export async function createArtistE2EVendor(
  admin: SupabaseClient,
  prefix = 'e2e-artist'
): Promise<ArtistE2EVendorContext> {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `${prefix}-${runId}@example.com`;
  const password = `E2E!${runId}aA1`;

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !createdUser.user) {
    throw userError ?? new Error('createUser failed');
  }

  const userId = createdUser.user.id;
  await seedTermsConsent(admin, userId);

  const { data: storeData, error: storeError } = await admin
    .from('stores')
    .insert({
      user_id: userId,
      name: `E2E Artist ${runId}`,
      slug: slugifyArtistE2E(`e2e-artist-${runId}`),
      description: 'E2E artist wizard',
      is_active: true,
      commerce_type: 'artist',
      metadata: { commerce_type: 'artist' },
    })
    .select('id')
    .single();

  if (storeError || !storeData) {
    throw storeError ?? new Error('store insert failed');
  }

  return {
    runId,
    email,
    password,
    userId,
    storeId: (storeData as { id: string }).id,
  };
}

export async function cleanupArtistE2EVendor(
  admin: SupabaseClient,
  ctx: Pick<ArtistE2EVendorContext, 'userId' | 'storeId'>,
  productIds: string[] = []
): Promise<void> {
  for (const productId of productIds) {
    await admin
      .from('products')
      .delete()
      .eq('id', productId)
      .catch(() => undefined);
  }
  await admin
    .from('stores')
    .delete()
    .eq('id', ctx.storeId)
    .catch(() => undefined);
  await admin.auth.admin.deleteUser(ctx.userId).catch(() => undefined);
}

export async function loginArtistVendor(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email-login"], input[type="email"]').first().fill(email);
  await page.locator('#password-login').fill(password);
  await page
    .locator('form')
    .filter({ has: page.locator('#password-login') })
    .locator('button[type="submit"]')
    .click();
  await expect(page).toHaveURL('/dashboard', { timeout: 30_000 });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
  await acceptTermsDialogIfVisible(page);
}

export async function openArtistCreateWizard(page: Page): Promise<void> {
  await page.goto('/dashboard/products/new/artist', { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
}

export async function selectArtistTypeVisual(page: Page): Promise<void> {
  await page.getByText('Artiste Visuel', { exact: false }).first().click();
}

export async function clickArtistWizardNext(page: Page, times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await dismissCookieBannerIfVisible(page);
    // Accessible name is often the aria-label ("Aller à l'étape suivante"), not visible "Suivant".
    await page
      .getByRole('button', { name: /Aller à l'étape suivante|Étape suivante|^Suivant$/i })
      .click({ timeout: 20_000 });
  }
}

export type FillArtistBasicInfoOptions = {
  artworkTitle: string;
  artistName?: string;
  medium?: string;
  price?: string;
  description?: string;
  editionType?: 'original' | 'limited_edition' | 'print' | 'reproduction';
};

export async function fillArtistBasicInfoStep(
  page: Page,
  options: FillArtistBasicInfoOptions
): Promise<void> {
  const {
    artworkTitle,
    artistName = 'Artiste E2E',
    medium = 'Huile sur toile',
    price = '75000',
    description = 'Description complète de l’œuvre pour le test E2E avec plus de dix caractères.',
    editionType,
  } = options;

  await page.locator('#artist_name').fill(artistName);
  await page.locator('#artwork_title').fill(artworkTitle);
  await page.locator('#artwork_medium').fill(medium);
  await page.locator('#price').fill(price);

  if (editionType && editionType !== 'original') {
    await page.locator('#edition_type').click();
    const label =
      editionType === 'limited_edition'
        ? 'Édition limitée'
        : editionType === 'print'
          ? 'Tirage'
          : 'Reproduction';
    await page.getByRole('option', { name: new RegExp(label, 'i') }).click();
  }

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }

  await uploadArtworkImage(page);
}

export async function uploadArtworkImage(page: Page): Promise<void> {
  await page.locator('#artwork-images-upload').setInputFiles({
    name: 'e2e-artwork.png',
    mimeType: 'image/png',
    buffer: E2E_ARTWORK_PNG,
  });

  await expect(page.getByText(/Images uploadées|image\(s\) uploadée\(s\)/i).first()).toBeVisible({
    timeout: 45_000,
  });
}

export async function fillArtistEditionStep(
  page: Page,
  editionNumber: number,
  total: number
): Promise<void> {
  await page.locator('#edition_number').fill(String(editionNumber));
  await page.locator('#total_editions').fill(String(total));
}

export async function goToArtistWizardStep(page: Page, targetStep: number): Promise<void> {
  for (let guard = 0; guard < 12; guard += 1) {
    const stepText = await page
      .getByText(/Étape \d+ sur 8/i)
      .first()
      .textContent();
    const match = stepText?.match(/Étape (\d+) sur 8/i);
    const current = match ? Number(match[1]) : 1;
    if (current >= targetStep) {
      await expect(page.getByText(new RegExp(`Étape ${targetStep} sur 8`, 'i'))).toBeVisible({
        timeout: 10_000,
      });
      return;
    }
    await clickArtistWizardNext(page, 1);
  }
  throw new Error(`Could not reach artist wizard step ${targetStep}`);
}

export async function advanceArtistWizardToPublishStep(page: Page): Promise<void> {
  await goToArtistWizardStep(page, 8);
}

export async function publishArtistWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Publier$/i }).click();
  await expect(page.getByText(/créé avec succès|succès/i).first()).toBeVisible({
    timeout: 45_000,
  });
}
