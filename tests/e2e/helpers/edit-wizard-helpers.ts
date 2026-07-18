import { expect, type Page } from '@playwright/test';
import { waitForReactApp } from '../shared/e2e-test-config';

export async function openProductEditWizard(page: Page, productId: string): Promise<void> {
  await page.goto(`/dashboard/products/${productId}/edit`, { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
}

export async function saveEditWizard(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /^Sauvegarder$/i })
    .first()
    .click();
  await expect(page.getByText(/mis à jour|succès|enregistré|modifié/i).first()).toBeVisible({
    timeout: 45_000,
  });
}

export async function saveArtistEditWizard(page: Page): Promise<void> {
  const draftButton = page.getByRole('button', { name: /Enregistrer comme brouillon/i });
  if (await draftButton.isVisible().catch(() => false)) {
    await draftButton.click();
  } else {
    await page.getByRole('button', { name: /Enregistrer les modifications/i }).click();
  }
  await expect(
    page.getByText(/mis à jour|succès|enregistré|modifié|brouillon/i).first()
  ).toBeVisible({
    timeout: 45_000,
  });
}

export async function updateDigitalProductName(page: Page, name: string): Promise<void> {
  await page.locator('#name').fill(name);
}

export async function updateCourseProductTitle(page: Page, title: string): Promise<void> {
  await page.locator('#title').fill(title);
}

export async function updatePhysicalProductName(page: Page, name: string): Promise<void> {
  await page.locator('#name').fill(name);
}

export async function updateServiceProductName(page: Page, name: string): Promise<void> {
  await page.locator('#name').fill(name);
}

export async function updateArtistArtworkTitle(page: Page, title: string): Promise<void> {
  await page.locator('#artwork_title').fill(title);
}
