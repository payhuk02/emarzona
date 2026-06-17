/**
 * E2E — Achat artiste payant : commande paid → portail client + certificat vérifiable
 *
 * npx playwright test tests/e2e/artist-paid-purchase.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { cleanupPaidFixture, seedPaidArtistFixture } from './helpers/paid-vertical-seed';
import { gotoApp, loginAs } from './shared/e2e-test-config';

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
      await loginAs(page, fixture.buyer.email, fixture.buyer.password);
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
      await gotoApp(page, `/verify/${code}`);
      await expect(page.getByText(/certificat authentique|œuvre|authenticité/i)).toBeVisible({
        timeout: 15_000,
      });
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
        const password = `E2E!${runId}aA1`;
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error || !data.user?.id) throw error ?? new Error('buyer create failed');
        return { email, password, id: data.user.id };
      })();

      await loginAs(page, unpaidBuyer.email, unpaidBuyer.password);
      await gotoApp(page, `/artist/${fixture.product.slug}`);

      const buyButton = page.getByRole('button', {
        name: /acheter|ajouter|panier|commander|buy/i,
      });
      await expect(buyButton.first()).toBeVisible({ timeout: 15_000 });
      await buyButton.first().click();

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
