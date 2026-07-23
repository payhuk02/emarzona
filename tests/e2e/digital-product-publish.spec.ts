/**
 * E2E — Publication produit digital via wizard (Sprint 2)
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  advanceDigitalWizardToPublishStep,
  fillDigitalBasicInfoStep,
  fillDigitalMainFileUrlStep,
  openDigitalCreateWizard,
  publishDigitalWizard,
} from './helpers/digital-wizard-helpers';
import {
  cleanupE2EVendor,
  createE2EVendor,
  clickWizardNext,
  loginE2EVendor,
} from './helpers/vendor-e2e-helpers';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Digital wizard — publish (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'digital-product-publish E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('full wizard publish → active product + digital-products redirect + digital_product_files', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-digital-pub');
    const productName = `Digital publié E2E ${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openDigitalCreateWizard(page);
    await waitForReactApp(page);

    await fillDigitalBasicInfoStep(page, { name: productName });
    await clickWizardNext(page, 1);

    await fillDigitalMainFileUrlStep(page);
    await clickWizardNext(page, 1);

    await advanceDigitalWizardToPublishStep(page);
    await publishDigitalWizard(page);

    await expect(page).toHaveURL('/dashboard/digital-products', { timeout: 30_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select(
        `
        id,
        name,
        product_type,
        is_draft,
        is_active,
        slug,
        digital_products (
          main_file_url,
          digital_product_files (
            is_main,
            file_url
          )
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'digital')
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
      slug: string;
      digital_products: Array<{
        main_file_url: string | null;
        digital_product_files: Array<{ is_main: boolean; file_url: string | null }>;
      }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(productName);
    expect(product.digital_products?.[0]?.main_file_url).toBeTruthy();
    const files = product.digital_products?.[0]?.digital_product_files ?? [];
    expect(files.some(f => f.is_main && Boolean(f.file_url))).toBe(true);

    testInfo.attach('published-digital-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });
});
