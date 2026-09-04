import { expect, type Locator, type Page } from '@playwright/test';
import { waitForReactApp } from '../shared/e2e-test-config';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { waitForStoresLoaded } from './seller-dashboard-setup';

/** Attend que la page création produit soit prête (boutique chargée, guard passé). */
export async function waitForProductCreatePageReady(page: Page): Promise<void> {
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);

  await expect(page.getByText(/Aucune boutique trouvée/i)).toHaveCount(0, { timeout: 45_000 });
  await expect(page.locator('[data-testid="seller-route-guard-loading"]')).toHaveCount(0, {
    timeout: 45_000,
  });
}

export async function waitForWizardMarker(
  page: Page,
  marker: Locator,
  label: string
): Promise<void> {
  const formCrash = page.getByTestId('form-error-boundary');
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    if (await formCrash.isVisible().catch(() => false)) {
      const body = (
        await page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).slice(0, 2000);
      throw new Error(
        `Wizard crashed (FormErrorBoundary) before marker "${label}" — url=${page.url()} body=${body}`
      );
    }
    if (
      await marker
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    await page.waitForTimeout(250);
  }

  const body = (
    await page
      .locator('body')
      .innerText()
      .catch(() => '')
  ).slice(0, 2000);
  throw new Error(`Wizard marker "${label}" not visible — url=${page.url()} body=${body}`);
}

export async function openProductCreateWizard(
  page: Page,
  path: string,
  marker: Locator,
  label: string,
  storeId?: string
): Promise<void> {
  if (storeId) {
    await page.evaluate(id => {
      localStorage.setItem('selectedStoreId', id);
    }, storeId);
  }

  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForProductCreatePageReady(page);

  if (storeId) {
    await waitForStoresLoaded(page, { storeId });
  }

  await waitForWizardMarker(page, marker, label);
}

/** Ouvre un SelectField (combobox) par son label et choisit une option. */
export async function selectWizardComboboxOption(
  page: Page,
  fieldLabel: string | RegExp,
  optionName: string | RegExp
): Promise<void> {
  const combobox = page.getByRole('combobox', { name: fieldLabel });
  await combobox.scrollIntoViewIfNeeded();
  await expect(combobox).toBeVisible({ timeout: 15_000 });
  await combobox.click();
  const option = page.getByRole('option', { name: optionName }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
  await expect(option)
    .toBeHidden({ timeout: 5_000 })
    .catch(() => undefined);
}
