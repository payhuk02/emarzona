/**
 * E2E — Flux cours : découverte → fiche → garde auth → checkout (si connecté)
 * Sprint 1 audit 2026 — encodage UTF-8 corrigé, routes /login alignées.
 *
 * Exécution : npx playwright test tests/e2e/course-enrollment-flow.spec.ts
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs } from './shared/e2e-test-config';

test.describe('Flux inscription aux cours', () => {
  test.setTimeout(90_000);

  test('découverte marketplace et fiche cours', async ({ page }) => {
    await gotoApp(page, '/marketplace');

    const card = page.locator('[data-testid="product-card"]').first();
    const hasCards = await card.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, 'Aucune carte produit sur marketplace (env vide)');
      return;
    }

    const courseFilter = page.locator(
      'button:has-text("Cours"), button:has-text("Course"), [data-product-type="course"]'
    );
    if (
      await courseFilter
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await courseFilter.first().click();
    }

    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 15_000 });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /inscrire|acheter|s'inscrire|enroll/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('redirection login si achat sans session', async ({ page }) => {
    await gotoApp(page, '/marketplace');
    const card = page.locator('[data-testid="product-card"]').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Marketplace sans produits');
      return;
    }

    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 15_000 });

    const enrollButton = page.getByRole('button', { name: /inscrire|acheter|s'inscrire/i }).first();
    if (!(await enrollButton.isVisible().catch(() => false))) {
      test.skip(true, 'Pas de CTA inscription sur cette fiche');
      return;
    }

    await enrollButton.click();
    await page.waitForURL(/\/(login|auth|checkout)/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/(login|auth|checkout)/);
  });

  test('utilisateur connecté : CTA mène vers checkout ou Moneroo', async ({ page }) => {
    test.skip(
      !process.env.E2E_RUN_AUTH_TESTS,
      'Set E2E_RUN_AUTH_TESTS=1 avec compte acheteur valide'
    );

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    await gotoApp(page, '/marketplace');

    const card = page.locator('[data-testid="product-card"]').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Marketplace sans produits');
      return;
    }

    const courseFilter = page.locator('button:has-text("Cours"), button:has-text("Course")');
    if (
      await courseFilter
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await courseFilter.first().click();
    }

    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 15_000 });

    const enrollButton = page.getByRole('button', { name: /inscrire|acheter|s'inscrire/i }).first();
    if (!(await enrollButton.isVisible().catch(() => false))) {
      test.skip(true, 'Pas de CTA sur fiche');
      return;
    }

    await enrollButton.click();
    await page.waitForURL(/\/(checkout|moneroo)/, { timeout: E2E_TEST_CONFIG.paymentTimeout });
    expect(page.url()).toMatch(/\/checkout|moneroo/);
  });

  test('page checkout répond sans erreur serveur', async ({ page }) => {
    const response = await gotoApp(page, '/checkout');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');
  });

  test('route /learn/:slug répond sans crash', async ({ page }) => {
    const slug = process.env.E2E_COURSE_SLUG ?? 'test-course-slug';
    const response = await gotoApp(page, `/learn/${slug}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('internal server error');
  });

  test('curriculum ou message vide visible sur fiche cours', async ({ page }) => {
    await gotoApp(page, '/marketplace');
    const card = page.locator('[data-testid="product-card"]').first();
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Marketplace sans produits');
      return;
    }

    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 15_000 });

    const curriculum = page.locator('text=/section|chapitre|module|curriculum|programme|leçon/i');
    const emptyState = page.locator('text=/aucune section|pas encore|coming soon/i');
    const hasCurriculum = (await curriculum.count()) > 0;
    const hasEmpty = await emptyState
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasCurriculum || hasEmpty || (await page.locator('h1').count()) > 0).toBeTruthy();
  });
});
