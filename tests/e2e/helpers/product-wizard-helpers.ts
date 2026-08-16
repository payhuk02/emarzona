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
  try {
    await expect(marker.first()).toBeVisible({ timeout: 90_000 });
  } catch (error) {
    const body = (
      await page
        .locator('body')
        .innerText()
        .catch(() => '')
    ).slice(0, 2000);
    throw new Error(`Wizard marker "${label}" not visible — url=${page.url()} body=${body}`, {
      cause: error,
    });
  }
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
