/**
 * E2E — Panier mixte service + physique : réserver → panier → checkout → payer → confirmer
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (Supabase test migré)
 * npx playwright test tests/e2e/mixed-cart-book-pay-confirm.spec.ts --config=playwright.vertical-paid.config.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  assertServiceBookingStatus,
  cleanupMixedCartFixture,
  seedMixedCartFixture,
  simulateMixedCartPayment,
  tomorrowAt10,
} from './helpers/mixed-cart-seed';
import { gotoApp, loginAsSeededUser } from './shared/e2e-test-config';

const supabaseUrl = resolveE2ESupabaseUrl() || undefined;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Mixed cart book → pay → confirm (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'mixed-cart-book-pay-confirm E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) throw new Error(message);
    test.skip(true, message);
  });

  test('service booking to cart, add physical, checkout and confirm booking', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fixture = await seedMixedCartFixture(admin, runId);
    let bookingId: string | undefined;
    let orderId: string | undefined;

    try {
      await loginAsSeededUser(page, admin, fixture.buyer.email);
      await gotoApp(page, `/service/${fixture.serviceProduct.id}`);

      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        fixture.serviceProduct.name,
        {
          timeout: 20_000,
        }
      );

      const { date } = tomorrowAt10();
      const calendarDay = page
        .locator('.fc-daygrid-day')
        .filter({ hasText: String(date.getDate()) })
        .first();
      if (await calendarDay.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await calendarDay.click();
      } else {
        await page
          .getByRole('button', { name: new RegExp(String(date.getDate()), 'i') })
          .first()
          .click();
      }

      const slotButton = page.getByRole('button', { name: /10:00|09:00|11:00/ }).first();
      await expect(slotButton).toBeVisible({ timeout: 15_000 });
      await slotButton.click();

      await page.getByRole('button', { name: /ajouter au panier/i }).click();
      await page.waitForURL(/\/cart/, { timeout: 30_000 });
      await expect(page.getByText(fixture.serviceProduct.name)).toBeVisible({ timeout: 10_000 });

      await gotoApp(page, `/physical/${fixture.physicalProduct.id}`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        fixture.physicalProduct.name,
        { timeout: 15_000 }
      );

      const addPhysical = page.getByRole('button', { name: /ajouter au panier/i });
      await expect(addPhysical).toBeEnabled({ timeout: 10_000 });
      await addPhysical.click();

      await gotoApp(page, '/cart');
      await expect(page.getByText(fixture.physicalProduct.name)).toBeVisible({ timeout: 10_000 });

      await page
        .getByRole('link', { name: /passer au paiement|checkout|commander/i })
        .first()
        .click();
      await page.waitForURL(/\/checkout/, { timeout: 30_000 });

      const firstName = page
        .locator('[data-testid="checkout-firstname"], input[name="firstName"]')
        .first();
      const lastName = page
        .locator('[data-testid="checkout-lastname"], input[name="lastName"]')
        .first();
      const email = page.locator('[data-testid="checkout-email"], input[name="email"]').first();
      const phone = page.locator('[data-testid="checkout-phone"], input[name="phone"]').first();

      await firstName.fill('E2E');
      await lastName.fill('Buyer');
      await email.fill(fixture.buyer.email);
      await phone.fill('+22670123456');

      const address = page.locator('input[name="address"]').first();
      if (await address.isVisible().catch(() => false)) {
        await address.fill('123 Rue Test');
        await page.locator('input[name="city"]').first().fill('Ouagadougou');
        await page.locator('input[name="country"]').first().fill('Burkina Faso');
      }

      const submit = page.locator('[data-testid="checkout-submit"]').first();
      await expect(submit).toBeVisible({ timeout: 10_000 });
      await submit.click();

      await page.waitForURL(/\/checkout/, { timeout: 45_000 });

      const { data: bookings } = await admin
        .from('service_bookings')
        .select('id, status')
        .eq('product_id', fixture.serviceProduct.id)
        .eq('user_id', fixture.buyer.id)
        .order('created_at', { ascending: false })
        .limit(1);

      bookingId = bookings?.[0]?.id;
      expect(bookingId).toBeTruthy();

      const { data: orders } = await admin
        .from('orders')
        .select('id, status, payment_status')
        .eq('store_id', fixture.store.id)
        .order('created_at', { ascending: false })
        .limit(1);

      orderId = orders?.[0]?.id;
      expect(orderId).toBeTruthy();

      await simulateMixedCartPayment(admin, orderId!, bookingId!);
      await assertServiceBookingStatus(admin, bookingId!, 'confirmed');
    } finally {
      try {
        await cleanupMixedCartFixture(admin, fixture);
      } catch (e) {
        testInfo.attach('cleanup-error', { body: String(e), contentType: 'text/plain' });
      }
    }
  });
});
