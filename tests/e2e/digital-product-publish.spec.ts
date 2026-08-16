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
  E2E_DIGITAL_MAIN_FILE_URL,
  E2E_DIGITAL_MAIN_FILE_URL_2,
  E2E_DIGITAL_MAIN_FILE_URL_3,
  openDigitalCreateWizard,
  publishDigitalWizard,
} from './helpers/digital-wizard-helpers';
import {
  cleanupE2EVendor,
  createE2EVendor,
  clickWizardNext,
  loginE2EVendor,
} from './helpers/vendor-e2e-helpers';

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

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openDigitalCreateWizard(page);

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
      digital_products:
        | {
            main_file_url: string | null;
            digital_product_files: Array<{ is_main: boolean; file_url: string | null }>;
          }
        | Array<{
            main_file_url: string | null;
            digital_product_files: Array<{ is_main: boolean; file_url: string | null }>;
          }>
        | null;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(productName);
    const digital = Array.isArray(product.digital_products)
      ? product.digital_products[0]
      : product.digital_products;
    expect(digital?.main_file_url).toBeTruthy();
    const files = digital?.digital_product_files ?? [];
    expect(files.some(f => f.is_main && Boolean(f.file_url))).toBe(true);

    testInfo.attach('published-digital-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('multiple main links → all saved as is_main in digital_product_files', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-digital-multi');
    const productName = `Digital multi-liens E2E ${ctx.runId}`;
    const mainUrls = [
      E2E_DIGITAL_MAIN_FILE_URL,
      E2E_DIGITAL_MAIN_FILE_URL_2,
      E2E_DIGITAL_MAIN_FILE_URL_3,
    ];
    const mainLabels = ['Partie 1 E2E', 'Partie 2 E2E', 'Partie 3 E2E'];

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openDigitalCreateWizard(page);

    await fillDigitalBasicInfoStep(page, { name: productName });
    await clickWizardNext(page, 1);

    await fillDigitalMainFileUrlStep(page, mainUrls, mainLabels);
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
        digital_products (
          main_file_url,
          digital_product_files (
            is_main,
            file_url,
            name,
            order_index
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
      digital_products:
        | {
            main_file_url: string | null;
            digital_product_files: Array<{
              is_main: boolean;
              file_url: string | null;
              name: string | null;
              order_index: number | null;
            }>;
          }
        | Array<{
            main_file_url: string | null;
            digital_product_files: Array<{
              is_main: boolean;
              file_url: string | null;
              name: string | null;
              order_index: number | null;
            }>;
          }>
        | null;
    };

    const digital = Array.isArray(product.digital_products)
      ? product.digital_products[0]
      : product.digital_products;
    const files = digital?.digital_product_files ?? [];
    const mainFiles = files.filter(file => file.is_main);

    expect(product.name).toBe(productName);
    expect(mainFiles).toHaveLength(mainUrls.length);
    expect(mainFiles.map(file => file.file_url)).toEqual(expect.arrayContaining(mainUrls));
    expect(mainFiles.map(file => file.name)).toEqual(expect.arrayContaining(mainLabels));
    expect(digital?.main_file_url).toBe(E2E_DIGITAL_MAIN_FILE_URL);

    testInfo.attach('published-digital-multi-link-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('selected category is persisted on publish', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-digital-cat');
    const productName = `Digital catégorie E2E ${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openDigitalCreateWizard(page);

    await fillDigitalBasicInfoStep(page, {
      name: productName,
      categoryLabel: 'Logiciel',
    });
    await clickWizardNext(page, 1);

    await fillDigitalMainFileUrlStep(page);
    await clickWizardNext(page, 1);

    await advanceDigitalWizardToPublishStep(page);
    await publishDigitalWizard(page);

    await expect(page).toHaveURL('/dashboard/digital-products', { timeout: 30_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select('id, name, category')
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'digital')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(queryError).toBeNull();
    expect(rows?.length).toBe(1);
    expect(rows![0].name).toBe(productName);
    expect(rows![0].category).toBe('logiciel');

    testInfo.attach('published-digital-category-product-id', {
      body: rows![0].id as string,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [rows![0].id as string]);
  });

  test('store can publish multiple digital products without quota block', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-digital-multi-pub');
    const productIds: string[] = [];

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);

    for (let index = 1; index <= 2; index += 1) {
      const productName = `Digital multi-pub ${index} E2E ${ctx.runId}`;

      await openDigitalCreateWizard(page);
      await fillDigitalBasicInfoStep(page, { name: productName });
      await clickWizardNext(page, 1);
      await fillDigitalMainFileUrlStep(page);
      await clickWizardNext(page, 1);
      await advanceDigitalWizardToPublishStep(page);
      await publishDigitalWizard(page);
      await expect(page).toHaveURL('/dashboard/digital-products', { timeout: 30_000 });

      const { data: row, error } = await admin
        .from('products')
        .select('id, name, is_active, is_draft')
        .eq('store_id', ctx.storeId)
        .eq('name', productName)
        .maybeSingle();

      expect(error).toBeNull();
      expect(row?.is_active).toBe(true);
      expect(row?.is_draft).toBe(false);
      productIds.push(row!.id as string);
    }

    const { count } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'digital')
      .eq('is_active', true);

    expect(count).toBeGreaterThanOrEqual(2);

    testInfo.attach('multi-publish-product-ids', {
      body: productIds.join(','),
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, productIds);
  });
});
