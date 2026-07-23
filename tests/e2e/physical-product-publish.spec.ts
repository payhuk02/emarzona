/**
 * E2E — Publication produit physique via wizard (Sprint 2)
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  advancePhysicalWizardToPublishStep,
  fillPhysicalBasicInfoStep,
  fillPhysicalInventoryStep,
  fillPhysicalShippingStep,
  openPhysicalCreateWizard,
  publishPhysicalWizard,
  clickWizardNext,
} from './helpers/physical-wizard-helpers';
import { cleanupE2EVendor, createE2EVendor, loginE2EVendor } from './helpers/vendor-e2e-helpers';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Physical wizard — publish (E2E)', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'physical-product-publish E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('full wizard publish → active product + physical-products redirect + inventory rows', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'physical', 'e2e-physical-pub');
    const productName = `Physique publié E2E ${ctx.runId}`;
    const sku = `E2E-PHY-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openPhysicalCreateWizard(page);
    await waitForReactApp(page);

    await fillPhysicalBasicInfoStep(page, { name: productName });
    await clickWizardNext(page, 1);

    await clickWizardNext(page, 1);

    await fillPhysicalInventoryStep(page, { sku, quantity: '25' });
    await clickWizardNext(page, 1);

    await fillPhysicalShippingStep(page, '1.5');
    await clickWizardNext(page, 1);

    await advancePhysicalWizardToPublishStep(page);
    await publishPhysicalWizard(page);

    await expect(page).toHaveURL('/dashboard/physical-products', { timeout: 45_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select(
        `
        id,
        name,
        product_type,
        is_draft,
        is_active,
        physical_products (
          id,
          sku,
          weight,
          track_inventory
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'physical')
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
      physical_products: Array<{
        id: string;
        sku: string | null;
        weight: number | null;
        track_inventory: boolean | null;
      }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(productName);
    expect(product.physical_products?.[0]?.sku).toBe(sku);
    expect(Number(product.physical_products?.[0]?.weight)).toBeGreaterThan(0);

    const physicalProductId = product.physical_products[0].id;

    const { data: inventoryRows, error: inventoryError } = await admin
      .from('physical_product_inventory')
      .select('quantity_available, track_inventory')
      .eq('physical_product_id', physicalProductId)
      .limit(1);

    expect(inventoryError).toBeNull();
    expect(inventoryRows?.length).toBeGreaterThan(0);
    expect(inventoryRows![0].quantity_available).toBeGreaterThan(0);

    testInfo.attach('published-physical-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });
});
