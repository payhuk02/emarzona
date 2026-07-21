import { expect, type Page } from '@playwright/test';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { clickWizardNext, goToWizardStep } from './vendor-e2e-helpers';
import { waitForReactApp } from '../shared/e2e-test-config';

export const SERVICE_WIZARD_TOTAL_STEPS = 8;

export type FillServiceBasicInfoOptions = {
  name: string;
  price?: string;
  description?: string;
};

export async function openServiceCreateWizard(page: Page): Promise<void> {
  await page.goto('/dashboard/products/new/service', { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
}

export async function fillServiceBasicInfoStep(
  page: Page,
  options: FillServiceBasicInfoOptions
): Promise<void> {
  const {
    name,
    price = '25000',
    description = 'Description complète du service E2E avec plus de dix caractères.',
  } = options;

  await page.locator('#name').fill(name);
  await page.locator('#price').fill(price);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }
}

export async function fillServiceDurationAvailabilityStep(
  page: Page,
  options: { locationAddress?: string } = {}
): Promise<void> {
  const { locationAddress = '12 avenue E2E, Abidjan' } = options;

  await page.getByRole('button', { name: /1 heure/i }).click();
  await page.locator('#location_address').fill(locationAddress);
  await page.getByRole('button', { name: /Ajouter un créneau/i }).click();
  await expect(page.getByText(/Lundi|09:00/i).first()).toBeVisible({ timeout: 10_000 });
}

export async function advanceServiceWizardToPublishStep(page: Page): Promise<void> {
  await goToWizardStep(page, SERVICE_WIZARD_TOTAL_STEPS, SERVICE_WIZARD_TOTAL_STEPS);
}

export async function publishServiceWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Publier le service|Publier$/i }).click();
  await expect(page.getByText(/publié|succès|disponible à la réservation/i).first()).toBeVisible({
    timeout: 60_000,
  });
}

export { clickWizardNext, goToWizardStep };
