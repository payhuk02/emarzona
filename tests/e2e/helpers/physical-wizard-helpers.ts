import { expect, type Page } from '@playwright/test';
import { E2E_ARTWORK_PNG } from './artist-wizard-helpers';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { clickWizardNext, goToWizardStep } from './vendor-e2e-helpers';
import { waitForReactApp } from '../shared/e2e-test-config';

export const PHYSICAL_WIZARD_TOTAL_STEPS = 9;

export type FillPhysicalBasicInfoOptions = {
  name: string;
  price?: string;
  description?: string;
};

export async function openPhysicalCreateWizard(page: Page): Promise<void> {
  await page.goto('/dashboard/products/new/physical', { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
}

export async function uploadPhysicalProductImage(page: Page): Promise<void> {
  await page.locator('input[type="file"][accept*="image"]').first().setInputFiles({
    name: 'e2e-physical-cover.png',
    mimeType: 'image/png',
    buffer: E2E_ARTWORK_PNG,
  });
  await expect(page.getByText(/Images uploadées|image\(s\) ajoutée\(s\)/i).first()).toBeVisible({
    timeout: 45_000,
  });
}

export async function fillPhysicalBasicInfoStep(
  page: Page,
  options: FillPhysicalBasicInfoOptions
): Promise<void> {
  const {
    name,
    price = '12000',
    description = 'Description complète du produit physique E2E avec plus de dix caractères.',
  } = options;

  await page.locator('#name').fill(name);
  await page.locator('#price').fill(price);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }

  await uploadPhysicalProductImage(page);
}

export async function fillPhysicalInventoryStep(
  page: Page,
  options: { sku: string; quantity?: string }
): Promise<void> {
  const { sku, quantity = '25' } = options;
  await page.locator('#sku').fill(sku);
  await page.locator('#quantity').fill(quantity);
}

export async function fillPhysicalShippingStep(page: Page, weight = '1.5'): Promise<void> {
  await page.locator('#weight').fill(weight);
}

export async function advancePhysicalWizardToPublishStep(page: Page): Promise<void> {
  await goToWizardStep(page, PHYSICAL_WIZARD_TOTAL_STEPS, PHYSICAL_WIZARD_TOTAL_STEPS);
}

export async function publishPhysicalWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Publier le produit|Publier$/i }).click();
  await expect(page.getByText(/publié|succès/i).first()).toBeVisible({ timeout: 60_000 });
}

export { clickWizardNext, goToWizardStep };
