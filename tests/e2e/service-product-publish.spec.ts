/**
 * E2E — Publication service via wizard (Sprint 2)
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  advanceServiceWizardToPublishStep,
  fillServiceBasicInfoStep,
  fillServiceDurationAvailabilityStep,
  openServiceCreateWizard,
  publishServiceWizard,
  clickWizardNext,
} from './helpers/service-wizard-helpers';
import { cleanupE2EVendor, createE2EVendor, loginE2EVendor } from './helpers/vendor-e2e-helpers';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Service wizard — publish (E2E)', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'service-product-publish E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('full wizard publish → active service + services redirect + availability slots', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'service', 'e2e-service-pub');
    const serviceName = `Service publié E2E ${ctx.runId}`;
    const locationAddress = `12 avenue E2E ${ctx.runId}, Abidjan`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openServiceCreateWizard(page);
    await waitForReactApp(page);

    await fillServiceBasicInfoStep(page, { name: serviceName });
    await clickWizardNext(page, 1);

    await fillServiceDurationAvailabilityStep(page, { locationAddress });
    await clickWizardNext(page, 1);

    await clickWizardNext(page, 2);

    await advanceServiceWizardToPublishStep(page);
    await publishServiceWizard(page);

    await expect(page).toHaveURL('/dashboard/services', { timeout: 45_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select(
        `
        id,
        name,
        product_type,
        is_draft,
        is_active,
        service_products (
          id,
          duration_minutes,
          location_type,
          location_address
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'service')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(queryError).toBeNull();
    expect(rows?.length).toBe(1);

    const product = rows![0] as {
      id: string;
      name: string;
      product_type: string;
      is_draft: boolean;
      is_active: boolean;
      service_products: Array<{
        id: string;
        duration_minutes: number;
        location_type: string;
        location_address: string | null;
      }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(serviceName);
    expect(product.service_products?.[0]?.duration_minutes).toBeGreaterThan(0);
    expect(product.service_products?.[0]?.location_type).toBe('on_site');
    expect(product.service_products?.[0]?.location_address).toBe(locationAddress);

    const serviceProductId = product.service_products[0].id;

    const { count: slotCount, error: slotError } = await admin
      .from('service_availability_slots')
      .select('id', { count: 'exact', head: true })
      .eq('service_product_id', serviceProductId);

    expect(slotError).toBeNull();
    expect(slotCount).toBeGreaterThan(0);

    testInfo.attach('published-service-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });
});
