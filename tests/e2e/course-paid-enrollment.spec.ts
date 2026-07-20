/**
 * E2E — Cours payant : commande paid → auto-enrollment → accès /learn/:slug
 *
 * Prérequis CI : SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migré)
 * npx playwright test tests/e2e/course-paid-enrollment.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
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

const supabaseUrl = resolveE2ESupabaseUrl() || undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Course paid enrollment (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'course-paid-enrollment E2E');
      return;
    }
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

      await loginAsSeededUser(
        page,
        admin,
        fixture.buyer.email,
        '/dashboard',
        fixture.buyer.password
      );
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
      await expect(page.getByRole('heading', { level: 1 })).toContainText(fixture.product.name, {
        timeout: 45_000,
      });
      // Enrolled CTA (avoid flaky "count 0" on S'inscrire while detail is still loading).
      await expect(
        page.getByRole('button', { name: /déjà inscrit|continuer/i }).first()
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      try {
        await Promise.race([
          cleanupPaidFixture(admin, fixture),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('cleanupPaidFixture timeout')), 30_000)
          ),
        ]);
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

      await page.waitForURL(/\/(checkout|geniuspay)/, { timeout: 30_000 });
      expect(page.url()).toMatch(/\/checkout|geniuspay/);

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
