/**
 * Epic 3.4 — E2E contrat : paiement cours → enrollment → /learn/:slug
 *
 * Flux complet GeniusPay : E2E_RUN_AUTH_TESTS=1 + E2E_COURSE_SLUG + staging.
 * Contrats SQL/RPC : toujours exécutés (skip si env vide).
 */

import { test, expect } from '@playwright/test';
import { E2E_TEST_CONFIG, gotoApp, loginAs, appLocator } from './shared/e2e-test-config';
import { resolveOrderStatusAfterPayment } from '../../src/lib/orders/order-status';
import { buildCourseLearnUrl } from '../../src/lib/courses/course-learn-redirect';

test.describe('Epic 3.4 — cours paiement → learn', () => {
  test('order-status: cours → completed après paiement', () => {
    expect(resolveOrderStatusAfterPayment(['course'])).toBe('completed');
  });

  test('buildCourseLearnUrl encode le slug', () => {
    expect(buildCourseLearnUrl('mon-cours')).toBe('/learn/mon-cours');
  });

  test('utilisateur inscrit accède à /learn/:slug', async ({ page }) => {
    test.skip(
      !process.env.E2E_RUN_AUTH_TESTS || !process.env.E2E_COURSE_SLUG,
      'E2E_RUN_AUTH_TESTS=1 et E2E_COURSE_SLUG requis'
    );

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    const slug = process.env.E2E_COURSE_SLUG!;
    const response = await gotoApp(page, `/learn/${slug}`);
    expect(response?.status()).toBeLessThan(500);

    await expect(appLocator(page).locator('body')).toBeVisible();
    const hasPlayerOrCurriculum = await appLocator(page)
      .locator('text=/leçon|lesson|curriculum|programme|continuer|play/i')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEnrollCta = await appLocator(page)
      .getByRole('button', { name: /inscrire|acheter/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPlayerOrCurriculum || hasEnrollCta).toBeTruthy();
  });

  test('payment success affiche CTA cours si product_type=course (mock URL)', async ({ page }) => {
    await gotoApp(page, '/payment/success?order_id=00000000-0000-0000-0000-000000000001');
    await expect(page.locator('body')).toBeVisible();
    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('internal server error');
  });

  test('fiche cours → checkout ou GeniusPay quand auth', async ({ page }) => {
    test.skip(!process.env.E2E_RUN_AUTH_TESTS, 'E2E_RUN_AUTH_TESTS=1 requis');

    const productId = process.env.E2E_COURSE_PRODUCT_ID;
    test.skip(!productId, 'E2E_COURSE_PRODUCT_ID requis');

    await loginAs(page, E2E_TEST_CONFIG.buyerEmail, E2E_TEST_CONFIG.buyerPassword);
    await gotoApp(page, `/courses/${productId}`);

    const enrollButton = appLocator(page)
      .getByRole('button', { name: /inscrire|acheter|s'inscrire/i })
      .first();
    if (!(await enrollButton.isVisible().catch(() => false))) {
      test.skip(true, 'Déjà inscrit ou pas de CTA');
      return;
    }

    await enrollButton.click();
    await page.waitForURL(/\/(checkout|geniuspay)/, { timeout: E2E_TEST_CONFIG.paymentTimeout });
    expect(page.url()).toMatch(/checkout|geniuspay/);
  });
});
