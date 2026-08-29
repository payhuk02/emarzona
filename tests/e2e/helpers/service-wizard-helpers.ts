import { expect, type Page } from '@playwright/test';
import { clickWizardNext, goToWizardStep } from './vendor-e2e-helpers';
import {
  openProductCreateWizard,
  selectWizardComboboxOption,
  waitForProductCreatePageReady,
} from './product-wizard-helpers';

export const SERVICE_WIZARD_TOTAL_STEPS = 8;

export async function readServiceWizardTotalSteps(page: Page): Promise<number> {
  const text = await page
    .getByText(/Étape \d+ sur \d+/i)
    .first()
    .textContent();
  const match = text?.match(/sur (\d+)/i);
  return match ? Number(match[1]) : SERVICE_WIZARD_TOTAL_STEPS;
}

export async function selectServiceFulfillmentMode(
  page: Page,
  mode: 'project' | 'appointment' | 'both'
): Promise<void> {
  const optionLabel =
    mode === 'project' ? /Prestation sur projet/i : mode === 'both' ? /Les deux/i : /Rendez-vous/i;
  await selectWizardComboboxOption(page, /Mode de prestation/i, optionLabel);
}

export async function fillServiceProjectPaymentStep(page: Page): Promise<void> {
  await page.locator('#delivery_secured').click({ force: true });
  const milestoneSwitch = page.locator('#use-milestones');
  if (await milestoneSwitch.isVisible({ timeout: 8_000 }).catch(() => false)) {
    const checked = await milestoneSwitch.isChecked();
    if (!checked) await milestoneSwitch.click();
  }
  await expect(page.getByText(/Jalons de paiement \(projet\)/i)).toBeVisible({
    timeout: 10_000,
  });
}

export async function advanceServiceProjectWizardToPublishStep(page: Page): Promise<void> {
  const total = await readServiceWizardTotalSteps(page);
  await goToWizardStep(page, total, total);
}

export async function advanceToServicePaymentStep(page: Page): Promise<void> {
  for (let guard = 0; guard < 10; guard += 1) {
    if (
      await page
        .locator('#delivery_secured')
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      return;
    }
    await clickWizardNext(page, 1);
  }
  throw new Error('Could not reach service payment step in wizard');
}

export type FillServiceBasicInfoOptions = {
  name: string;
  price?: string;
  promotionalPrice?: string;
  description?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function waitForServiceCategoryPickerReady(page: Page): Promise<void> {
  const parent = page.getByRole('combobox', { name: /^Catégorie/ });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await parent.isEnabled({ timeout: 20_000 }).catch(() => false)) {
      return;
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForProductCreatePageReady(page);
  }
  await expect(parent).toBeEnabled({ timeout: 60_000 });
}

async function selectFirstServiceLeafCategory(page: Page): Promise<void> {
  await waitForServiceCategoryPickerReady(page);
  const parent = page.getByRole('combobox', { name: /^Catégorie/ });

  await parent.click();
  const parentOptions = page.getByRole('option');
  await expect(parentOptions.first()).toBeVisible({ timeout: 20_000 });
  const parentCount = await parentOptions.count();
  const labels: string[] = [];
  for (let i = 0; i < parentCount; i += 1) {
    labels.push((await parentOptions.nth(i).innerText()).trim());
  }
  await page.keyboard.press('Escape');

  for (const label of labels) {
    if (!label) continue;
    await selectWizardComboboxOption(page, /^Catégorie/, new RegExp(`^${escapeRegExp(label)}$`));
    const child = page.getByRole('combobox', { name: /Sous-catégorie/ });
    if (await child.isDisabled()) continue;
    await child.click();
    const childOption = page.getByRole('option').first();
    if (await childOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await childOption.click();
      return;
    }
    await page.keyboard.press('Escape');
  }

  throw new Error('No service category with a subcategory was available');
}

async function fillServiceCategorySpecificFields(page: Page): Promise<void> {
  const extras = page.getByTestId('service-category-specific-fields');
  await expect(extras).toBeVisible({ timeout: 20_000 });

  const comboboxes = extras.getByRole('combobox');
  const comboCount = await comboboxes.count();
  for (let i = 0; i < comboCount; i += 1) {
    const box = comboboxes.nth(i);
    const current = (await box.innerText()).trim();
    if (current && !/sélectionner|choisissez|chargement/i.test(current)) {
      continue;
    }
    await box.click();
    await page.getByRole('listbox').getByRole('option').first().click();
    await expect(page.getByRole('option').first())
      .toBeHidden({ timeout: 5_000 })
      .catch(() => undefined);
  }

  const fields = extras.locator(
    'input:not([type="checkbox"]):not([type="hidden"]):not([type="radio"]), textarea'
  );
  const fieldCount = await fields.count();
  for (let i = 0; i < fieldCount; i += 1) {
    const field = fields.nth(i);
    const value = await field.inputValue().catch(() => '');
    if (value.trim()) continue;
    const type = await field.getAttribute('type');
    await field.fill(type === 'number' ? '1' : 'E2E');
  }

  const chipGroups = extras.locator('.flex.flex-wrap.gap-2');
  const groupCount = await chipGroups.count();
  for (let i = 0; i < groupCount; i += 1) {
    const group = chipGroups.nth(i);
    const selected = group.locator('button.border-primary');
    if ((await selected.count()) === 0) {
      await group.locator('button[type="button"]').first().click();
    }
  }
}

export async function openServiceCreateWizard(page: Page, storeId?: string): Promise<void> {
  await openProductCreateWizard(
    page,
    '/dashboard/products/new/service',
    page.locator('#name'),
    'service #name',
    storeId
  );
}

export async function fillServiceBasicInfoStep(
  page: Page,
  options: FillServiceBasicInfoOptions
): Promise<void> {
  const {
    name,
    price = '250',
    promotionalPrice = '150',
    description = 'Description complète du service E2E avec plus de dix caractères.',
  } = options;

  await page.locator('#name').fill(name);
  await page.locator('#price').fill(price);
  await page.locator('#promotional_price').fill(promotionalPrice);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }

  await selectFirstServiceLeafCategory(page);
  await fillServiceCategorySpecificFields(page);
}

export async function fillServiceDurationAvailabilityStep(
  page: Page,
  options: { locationAddress?: string } = {}
): Promise<void> {
  const { locationAddress = '12 avenue E2E, Abidjan' } = options;

  const hourChip = page.getByRole('button', { name: /1 heure/i });
  const dayChip = page.getByRole('button', { name: /7 jours/i });
  if (await hourChip.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await hourChip.click();
  } else if (await dayChip.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await dayChip.click();
  }

  const address = page.locator('#location_address');
  if (await address.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await address.fill(locationAddress);
  }

  const addSlot = page.getByRole('button', { name: /Ajouter un créneau/i });
  if (await addSlot.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await addSlot.click();
    await expect(page.getByText(/Lundi|09:00/i).first()).toBeVisible({ timeout: 10_000 });
  }
}

export async function advanceServiceWizardToPublishStep(page: Page): Promise<void> {
  await goToWizardStep(page, SERVICE_WIZARD_TOTAL_STEPS, SERVICE_WIZARD_TOTAL_STEPS);
}

const SERVICE_DASHBOARD_LIST_URL = /\/dashboard\/services\/?(?:\?.*)?$/;

export async function publishServiceWizard(page: Page): Promise<void> {
  const errorToast = page.getByText(/Validation incomplète|❌\s*Erreur/i).first();
  const successToast = page.getByText(/Service publié|disponible à la réservation/i).first();

  await page.getByRole('button', { name: /Publier le service|^Publier$/i }).click();

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 90_000 }),
    errorToast.waitFor({ state: 'visible', timeout: 90_000 }),
    page.waitForURL(SERVICE_DASHBOARD_LIST_URL, { timeout: 90_000 }),
  ]).catch(() => undefined);

  if (await errorToast.isVisible().catch(() => false)) {
    const copy = (await errorToast.innerText().catch(() => '')).slice(0, 400);
    throw new Error(`Service publish failed in UI: ${copy}`);
  }

  await expect(page).toHaveURL(SERVICE_DASHBOARD_LIST_URL, { timeout: 90_000 });
}

export { clickWizardNext, goToWizardStep };
