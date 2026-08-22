import { expect, type Page } from '@playwright/test';
import { clickWizardNext, goToWizardStep } from './vendor-e2e-helpers';
import { openProductCreateWizard, selectWizardComboboxOption } from './product-wizard-helpers';

export type FillCourseBasicInfoOptions = {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price?: string;
};

export async function openCourseCreateWizard(page: Page): Promise<void> {
  await openProductCreateWizard(
    page,
    '/dashboard/courses/new',
    page.locator('#title'),
    'course #title'
  );
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
    price = '150',
  } = options;

  await page.locator('#title').fill(title);
  if (slug) {
    await page.locator('#slug').fill(slug);
  }
  await page.locator('#short_description').fill(shortDescription);

  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await editor.click();
    await editor.fill(description);
  }

  await selectWizardComboboxOption(page, 'Niveau du cours', /Débutant/i);
  await selectWizardComboboxOption(page, 'Langue du cours', /Français/i);
  await selectWizardComboboxOption(page, 'Catégorie', /^Business$/i);

  await page.locator('#price').fill(price);
}

export async function fillCourseCurriculumStep(page: Page): Promise<void> {
  const emptyStateCta = page.getByTestId('course-add-first-section');
  const headerCta = page.getByTestId('course-add-section');
  await expect(headerCta).toBeVisible({ timeout: 20_000 });
  if (await emptyStateCta.isVisible()) {
    await emptyStateCta.click();
  } else {
    await headerCta.click();
  }
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

const COURSE_DASHBOARD_LIST_URL = /\/dashboard\/courses\/?(?:\?.*)?$/;

export async function publishCourseWizard(page: Page): Promise<void> {
  const errorToast = page.getByText(/Validation incomplète|❌\s*Erreur/i).first();
  const successToast = page.getByText(/Cours publié|est maintenant en ligne/i).first();

  await page.getByRole('button', { name: /Publier le cours|^Publier$/i }).click();

  await Promise.race([
    successToast.waitFor({ state: 'visible', timeout: 90_000 }),
    errorToast.waitFor({ state: 'visible', timeout: 90_000 }),
    page.waitForURL(COURSE_DASHBOARD_LIST_URL, { timeout: 90_000 }),
  ]).catch(() => undefined);

  if (await errorToast.isVisible().catch(() => false)) {
    const copy = (await errorToast.innerText().catch(() => '')).slice(0, 400);
    throw new Error(`Course publish failed in UI: ${copy}`);
  }

  await expect(page).toHaveURL(COURSE_DASHBOARD_LIST_URL, { timeout: 90_000 });
}

export { clickWizardNext, goToWizardStep };
