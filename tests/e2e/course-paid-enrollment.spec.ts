/**
 * E2E — Cours payant : commande paid → auto-enrollment → accès /learn/:slug
 *
 * Prérequis CI : SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migré)
 * npx playwright test tests/e2e/course-paid-enrollment.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import {
  assertCourseEnrollment,
  cleanupPaidFixture,
  seedPaidCourseFixture,
} from './helpers/paid-vertical-seed';
import { gotoApp, loginAsSeededUser, E2E_TEST_CONFIG } from './shared/e2e-test-config';
import {
  attachSupabaseProbeListener,
  formatSupabaseProbeSummary,
} from './helpers/capture-supabase-probe';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Course paid enrollment (E2E)', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    if (canRun) return;
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) throw new Error(message);
    test.skip(true, message);
  });

  test('paid order enrolls buyer and unlocks learn route', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const fixture = await seedPaidCourseFixture(admin, runId);
    const { getLatestProbe, runProbe } = attachSupabaseProbeListener(page, testInfo);
    try {
      await assertCourseEnrollment(admin, fixture.courseId, fixture.buyer.id);

      await loginAsSeededUser(page, admin, fixture.buyer.email);
      await gotoApp(page, `/learn/${fixture.product.slug}`);

      await page.waitForFunction(() => typeof window.__e2eSupabaseProbe === 'function', {
        timeout: 15_000,
      });
      const probe = (await runProbe()) ?? getLatestProbe();
      const probeSummary = formatSupabaseProbeSummary(probe);
      console.log('BROWSER_SUPABASE_PROBE', probeSummary, probe);
      testInfo.annotations.push({ type: 'supabase-probe', description: probeSummary });

      if (!probe) {
        throw new Error('Supabase browser probe missing (window.__e2eSupabaseProbe)');
      }
      if (String(probe.productsSlugQueryError ?? '').includes('Invalid API key')) {
        throw new Error(`Supabase browser probe: ${probeSummary}`);
      }

      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByRole('button', { name: /inscrire|s'inscrire|enroll/i })).toHaveCount(
        0
      );
      await expect(page.getByRole('heading', { level: 1 })).toContainText(fixture.product.name, {
        timeout: 20_000,
      });
    } finally {
      try {
        await cleanupPaidFixture(admin, fixture);
      } catch (e) {
        testInfo.attach('cleanup-error', { body: String(e), contentType: 'text/plain' });
      }
    }
  });

  test('logged-in buyer reaches checkout from course detail', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-cta-${Math.random().toString(16).slice(2)}`;

    const fixture = await seedPaidCourseFixture(admin, runId);
    try {
      const unpaidBuyer = await (async () => {
        const email = `e2e-course-cta-${runId}@example.com`;
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: E2E_TEST_CONFIG.seededUserPassword,
          email_confirm: true,
        });
        if (error || !data.user?.id) throw error ?? new Error('buyer create failed');
        return { email, id: data.user.id };
      })();

      await loginAsSeededUser(page, admin, unpaidBuyer.email);
      await gotoApp(page, `/courses/${fixture.product.slug}`);

      const enrollButton = page.getByRole('button', {
        name: /s'inscrire maintenant|inscrire|acheter|enroll/i,
      });
      await expect(enrollButton.first()).toBeVisible({ timeout: 15_000 });
      await enrollButton.first().click();

      await page.waitForURL(/\/(checkout|moneroo)/, { timeout: 30_000 });
      expect(page.url()).toMatch(/\/checkout|moneroo/);

      await admin.auth.admin.deleteUser(unpaidBuyer.id);
    } finally {
      try {
        await cleanupPaidFixture(admin, fixture);
      } catch (e) {
        testInfo.attach('cleanup-error', { body: String(e), contentType: 'text/plain' });
      }
    }
  });
});
