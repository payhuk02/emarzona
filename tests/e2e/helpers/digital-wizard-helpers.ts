import { expect, type Page } from '@playwright/test';
import { E2E_ARTWORK_PNG } from './artist-wizard-helpers';
import { goToWizardStep } from './vendor-e2e-helpers';
import { openProductCreateWizard } from './product-wizard-helpers';
import { dismissCookieBannerIfVisible } from './store-theme-helpers';

export const E2E_DIGITAL_MAIN_FILE_URL = 'https://example.com/e2e-digital-product.pdf';
export const E2E_DIGITAL_MAIN_FILE_URL_2 = 'https://example.com/e2e-digital-product-part2.pdf';
export const E2E_DIGITAL_MAIN_FILE_URL_3 = 'https://example.com/e2e-digital-product-part3.pdf';

export type FillDigitalBasicInfoOptions = {
  name: string;
  price?: string;
  description?: string;
  categoryLabel?: string;
};

export async function openDigitalCreateWizard(page: Page): Promise<void> {
  await openProductCreateWizard(
    page,
    '/dashboard/products/new/digital',
    page.locator('#name'),
    'digital #name'
  );
}

export async function fillDigitalBasicInfoStep(
  page: Page,
  options: FillDigitalBasicInfoOptions
): Promise<void> {
  const {
    name,
    price = '50',
    description = 'Description complète du produit digital E2E avec plus de dix caractères.',
    categoryLabel,
  } = options;

  await page.locator('#name').fill(name);
  await page.locator('#price').fill(price);

  if (categoryLabel) {
    await page.getByText('Catégorie', { exact: false }).first().click();
    await page
      .getByRole('option', { name: new RegExp(categoryLabel, 'i') })
      .first()
      .click();
  }

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }
}

export async function fillDigitalMainFileUrlStep(
  page: Page,
  urls: string[] = [E2E_DIGITAL_MAIN_FILE_URL],
  labels: string[] = []
): Promise<void> {
  const mainUrlInput = page.locator('input[type="url"][placeholder*="fichier-principal"]').first();
  const mainLabelInput = page.locator('#main-link-label');
  await expect(mainUrlInput).toBeVisible({ timeout: 15_000 });

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const label = labels[i]?.trim();

    if (label) {
      await mainLabelInput.fill(label);
    } else {
      await mainLabelInput.fill('');
    }

    await mainUrlInput.fill(url);
    await mainUrlInput
      .locator('xpath=ancestor::div[contains(@class,"border-dashed")]')
      .getByRole('button', { name: /Ajouter/i })
      .click();
    await expect(page.getByLabel(`URL du lien ${i + 1}`)).toHaveValue(url, { timeout: 10_000 });

    if (label) {
      await expect(page.getByPlaceholder(/Nom affiché/i).nth(i)).toHaveValue(label, {
        timeout: 10_000,
      });
    }
  }

  if (urls.length > 1) {
    await expect(page.getByText(/Liens principaux ajoutés/i)).toContainText(String(urls.length));
  }
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
