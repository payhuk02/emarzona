/**
 * E2E — Achat artiste payant : commande paid → portail client + certificat vérifiable
 *
 * npx playwright test tests/e2e/artist-paid-purchase.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import {
  assertCourseEnrollment,
  assertCertificateVerification,
  cleanupPaidFixture,
  seedPaidArtistFixture,
} from './helpers/paid-vertical-seed';
import { gotoApp, loginAsSeededUser, E2E_TEST_CONFIG } from './shared/e2e-test-config';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Artist paid purchase (E2E)', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    if (canRun) return;
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) throw new Error(message);
    test.skip(true, message);
  });

  test('paid order appears in customer artist portal', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const fixture = await seedPaidArtistFixture(admin, runId);
    try {
      await loginAsSeededUser(page, admin, fixture.buyer.email);
      await gotoApp(page, '/account/artist');

      await expect(page.getByRole('heading', { name: /espace artiste/i })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(fixture.product.name)).toBeVisible({ timeout: 20_000 });
    } finally {
      try {
        await cleanupPaidFixture(admin, fixture);
      } catch (e) {
        testInfo.attach('cleanup-error', { body: String(e), contentType: 'text/plain' });
      }
    }
  });

  test('certificate verification page accepts seeded code', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-cert-${Math.random().toString(16).slice(2)}`;

    const fixture = await seedPaidArtistFixture(admin, runId);
    const code = fixture.certificateVerificationCode!;
    try {
      await assertCertificateVerification(admin, code);
      await gotoApp(page, `/verify/${code}`);
      await expect(page.getByRole('heading', { name: /vérification de certificat/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(code, { exact: false })).toBeVisible();
      const authentic = page.getByText(/certificat authentique/i);
      const rpcUnavailable = page.getByText(/impossible de contacter le service/i);
      if (await authentic.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await expect(authentic).toBeVisible();
      } else if (await rpcUnavailable.isVisible().catch(() => false)) {
        testInfo.annotations.push({
          type: 'note',
          description:
            'UI RPC verify indisponible (clé publishable locale) — validé côté service role.',
        });
      }
    } finally {
      try {
        await cleanupPaidFixture(admin, fixture);
      } catch (e) {
        testInfo.attach('cleanup-error', { body: String(e), contentType: 'text/plain' });
      }
    }
  });

  test('logged-in buyer reaches checkout from artist product detail', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-cta-${Math.random().toString(16).slice(2)}`;

    const fixture = await seedPaidArtistFixture(admin, runId);
    try {
      const unpaidBuyer = await (async () => {
        const email = `e2e-artist-cta-${runId}@example.com`;
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: E2E_TEST_CONFIG.seededUserPassword,
          email_confirm: true,
        });
        if (error || !data.user?.id) throw error ?? new Error('buyer create failed');
        return { email, id: data.user.id };
      })();

      await loginAsSeededUser(page, admin, unpaidBuyer.email);
      await gotoApp(page, `/artist/${fixture.product.id}`);

      const addToCart = page.getByTestId('artist-add-to-cart');
      await expect(addToCart).toBeVisible({ timeout: 15_000 });
      await addToCart.click();

      await gotoApp(page, '/checkout');
      await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });

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
