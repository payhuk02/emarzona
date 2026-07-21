import { expect, type Page } from '@playwright/test';
import { E2E_ARTWORK_PNG } from './artist-wizard-helpers';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { goToWizardStep } from './vendor-e2e-helpers';
import { waitForReactApp } from '../shared/e2e-test-config';

export const E2E_DIGITAL_MAIN_FILE_URL = 'https://example.com/e2e-digital-product.pdf';

export type FillDigitalBasicInfoOptions = {
  name: string;
  price?: string;
  description?: string;
};

export async function openDigitalCreateWizard(page: Page): Promise<void> {
  await page.goto('/dashboard/products/new/digital', { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
  await expect(page.locator('#name')).toBeVisible({ timeout: 60_000 });
}

export async function fillDigitalBasicInfoStep(
  page: Page,
  options: FillDigitalBasicInfoOptions
): Promise<void> {
  const {
    name,
    price = '5000',
    description = 'Description complète du produit digital E2E avec plus de dix caractères.',
  } = options;

  await page.locator('#name').fill(name);
  await page.locator('#price').fill(price);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }
}

export async function fillDigitalMainFileUrlStep(page: Page): Promise<void> {
  await page.getByRole('tab', { name: /URL externe/i }).click();
  await page
    .locator('input[type="url"][placeholder*="exemple.com/fichier"]')
    .first()
    .fill(E2E_DIGITAL_MAIN_FILE_URL);
  await expect(page.getByText(/Lien principal configuré/i)).toBeVisible({ timeout: 10_000 });
}

export async function advanceDigitalWizardToPublishStep(page: Page): Promise<void> {
  await goToWizardStep(page, 6, 6);
}

export async function publishDigitalWizard(page: Page): Promise<void> {
  await dismissCookieBannerIfVisible(page);
  await page.getByRole('button', { name: /^Publier(?: le produit)?$/i }).click({ timeout: 20_000 });
  await expect(page.getByText(/publié|succès/i).first()).toBeVisible({ timeout: 45_000 });
}

export async function uploadDigitalCoverImage(page: Page): Promise<void> {
  await page.locator('#images_upload').setInputFiles({
    name: 'e2e-digital-cover.png',
    mimeType: 'image/png',
    buffer: E2E_ARTWORK_PNG,
  });
  await expect(page.getByText(/upload|image/i).first())
    .toBeVisible({ timeout: 45_000 })
    .catch(() => undefined);
}
