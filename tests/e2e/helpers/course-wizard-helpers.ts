import { expect, type Page } from '@playwright/test';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { clickWizardNext, goToWizardStep } from './vendor-e2e-helpers';
import { waitForReactApp } from '../shared/e2e-test-config';

export type FillCourseBasicInfoOptions = {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price?: string;
};

export async function openCourseCreateWizard(page: Page): Promise<void> {
  await page.goto('/dashboard/courses/new', { waitUntil: 'domcontentloaded' });
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
  await expect(page.getByText(/Aucune boutique trouvée/i)).toHaveCount(0, { timeout: 5_000 });

  const title = page.locator('#title');
  try {
    await expect(title).toBeVisible({ timeout: 60_000 });
  } catch (error) {
    const body = (
      await page
        .locator('body')
        .innerText()
        .catch(() => '')
    ).slice(0, 400);
    throw new Error(`Course wizard #title not visible — url=${page.url()} body=${body}`, {
      cause: error,
    });
  }
}

export async function fillCourseBasicInfoStep(
  page: Page,
  options: FillCourseBasicInfoOptions
): Promise<void> {
  const {
    title,
    slug,
    shortDescription = 'Résumé court du cours E2E pour les tests automatisés.',
    description = 'Description complète du cours E2E avec objectifs pédagogiques détaillés.',
    price = '15000',
  } = options;

  await page.locator('#title').fill(title);
  if (slug) {
    await page.locator('#slug').fill(slug);
  }
  await page.locator('#short_description').fill(shortDescription);
  await page.locator('#price').fill(price);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }

  await page.getByText('Niveau du cours', { exact: false }).click();
  await page
    .getByRole('option', { name: /Débutant/i })
    .first()
    .click();

  await page.getByText('Langue du cours', { exact: false }).click();
  await page
    .getByRole('option', { name: /Français/i })
    .first()
    .click();

  await page.getByText('Catégorie', { exact: false }).first().click();
  await page
    .getByRole('option', { name: /Business/i })
    .first()
    .click();
}

export async function fillCourseCurriculumStep(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Ajouter une section|Créer la première section/i })
    .click();
  await page.getByPlaceholder('Titre de la section').fill('Section E2E');
  await page
    .getByRole('button', { name: /^Enregistrer$/i })
    .first()
    .click();

  await page.getByRole('button', { name: /Ajouter une leçon/i }).click();
  await page.getByPlaceholder('Ex: Introduction au React').fill('Leçon E2E introduction');

  await page.getByRole('button', { name: /Ajouter une vidéo/i }).click();
  await page.getByRole('tab', { name: /YouTube/i }).click();
  await page
    .locator('input[placeholder*="youtube"], input[type="url"]')
    .first()
    .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.getByRole('button', { name: /Ajouter la vidéo YouTube/i }).click();
  await expect(page.getByText(/YouTube ajoutée|vidéo YouTube/i).first()).toBeVisible({
    timeout: 15_000,
  });

  await page
    .getByRole('button', { name: /^Enregistrer$/i })
    .last()
    .click();
}

export async function advanceCourseWizardToPublishStep(page: Page): Promise<void> {
  await goToWizardStep(page, 7, 7);
}

export async function publishCourseWizard(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Publier le cours|Publier$/i }).click();
  await expect(page.getByText(/publi|succès|créé/i).first()).toBeVisible({ timeout: 60_000 });
}

export { clickWizardNext, goToWizardStep };
