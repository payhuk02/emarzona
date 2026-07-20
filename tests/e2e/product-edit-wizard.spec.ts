/**
 * E2E — Smoke edit wizards (5 verticales) : load → rename step 1 → save → redirect + DB
 */
import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  advanceCourseWizardToPublishStep,
  fillCourseBasicInfoStep,
  fillCourseCurriculumStep,
  openCourseCreateWizard,
  publishCourseWizard,
  clickWizardNext as clickCourseWizardNext,
} from './helpers/course-wizard-helpers';
import {
  advanceDigitalWizardToPublishStep,
  fillDigitalBasicInfoStep,
  fillDigitalMainFileUrlStep,
  openDigitalCreateWizard,
  publishDigitalWizard,
} from './helpers/digital-wizard-helpers';
import {
  advancePhysicalWizardToPublishStep,
  fillPhysicalBasicInfoStep,
  fillPhysicalInventoryStep,
  fillPhysicalShippingStep,
  openPhysicalCreateWizard,
  publishPhysicalWizard,
  clickWizardNext as clickPhysicalWizardNext,
} from './helpers/physical-wizard-helpers';
import {
  advanceServiceWizardToPublishStep,
  fillServiceBasicInfoStep,
  fillServiceDurationAvailabilityStep,
  openServiceCreateWizard,
  publishServiceWizard,
  clickWizardNext as clickServiceWizardNext,
} from './helpers/service-wizard-helpers';
import {
  advanceArtistWizardToPublishStep,
  cleanupArtistE2EVendor,
  createArtistE2EVendor,
  fillArtistBasicInfoStep,
  loginArtistVendor,
  openArtistCreateWizard,
  publishArtistWizard,
  selectArtistTypeVisual,
  clickArtistWizardNext,
} from './helpers/artist-wizard-helpers';
import {
  cleanupE2EVendor,
  createE2EVendor,
  loginE2EVendor,
  clickWizardNext,
} from './helpers/vendor-e2e-helpers';
import {
  openProductEditWizard,
  saveEditWizard,
  saveArtistEditWizard,
  updateArtistArtworkTitle,
  updateCourseProductTitle,
  updateDigitalProductName,
  updatePhysicalProductName,
  updateServiceProductName,
} from './helpers/edit-wizard-helpers';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

async function fetchLatestProductId(
  admin: SupabaseClient,
  storeId: string,
  productType: string
): Promise<string> {
  const { data, error } = await admin
    .from('products')
    .select('id')
    .eq('store_id', storeId)
    .eq('product_type', productType)
    .order('created_at', { ascending: false })
    .limit(1);
  expect(error).toBeNull();
  expect(data?.length).toBe(1);
  return (data![0] as { id: string }).id;
}

test.describe('Edit product wizards — smoke (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'product-edit-wizard E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('digital edit wizard saves renamed product', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-edit-digital');
    const originalName = `Digital edit E2E ${ctx.runId}`;
    const updatedName = `${originalName} (modifié)`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openDigitalCreateWizard(page);
    await waitForReactApp(page);
    await fillDigitalBasicInfoStep(page, { name: originalName });
    await clickWizardNext(page, 1);
    await fillDigitalMainFileUrlStep(page);
    await clickWizardNext(page, 1);
    await advanceDigitalWizardToPublishStep(page);
    await publishDigitalWizard(page);

    const productId = await fetchLatestProductId(admin, ctx.storeId, 'digital');
    await openProductEditWizard(page, productId);
    await updateDigitalProductName(page, updatedName);
    await saveEditWizard(page);

    await expect(page).toHaveURL('/dashboard/digital-products', { timeout: 45_000 });

    const { data: row } = await admin.from('products').select('name').eq('id', productId).single();
    expect(row?.name).toBe(updatedName);

    testInfo.attach('edited-digital-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });

  test('course edit wizard saves renamed product', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'course', 'e2e-edit-course');
    const originalTitle = `Cours edit E2E ${ctx.runId}`;
    const updatedTitle = `${originalTitle} (modifié)`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openCourseCreateWizard(page);
    await waitForReactApp(page);
    await fillCourseBasicInfoStep(page, { title: originalTitle });
    await clickCourseWizardNext(page, 1);
    await fillCourseCurriculumStep(page);
    await clickCourseWizardNext(page, 1);
    await advanceCourseWizardToPublishStep(page);
    await publishCourseWizard(page);

    const productId = await fetchLatestProductId(admin, ctx.storeId, 'course');
    await openProductEditWizard(page, productId);
    await updateCourseProductTitle(page, updatedTitle);
    await saveEditWizard(page);

    await expect(page).toHaveURL('/dashboard/courses', { timeout: 45_000 });

    const { data: row } = await admin.from('products').select('name').eq('id', productId).single();
    expect(row?.name).toBe(updatedTitle);

    testInfo.attach('edited-course-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });

  test('physical edit wizard saves renamed product', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'physical', 'e2e-edit-physical');
    const originalName = `Physique edit E2E ${ctx.runId}`;
    const updatedName = `${originalName} (modifié)`;
    const sku = `E2E-EDIT-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openPhysicalCreateWizard(page);
    await waitForReactApp(page);
    await fillPhysicalBasicInfoStep(page, { name: originalName });
    await clickPhysicalWizardNext(page, 1);
    await clickPhysicalWizardNext(page, 1);
    await fillPhysicalInventoryStep(page, { sku, quantity: '10' });
    await clickPhysicalWizardNext(page, 1);
    await fillPhysicalShippingStep(page, '1.2');
    await clickPhysicalWizardNext(page, 1);
    await advancePhysicalWizardToPublishStep(page);
    await publishPhysicalWizard(page);

    const productId = await fetchLatestProductId(admin, ctx.storeId, 'physical');
    await openProductEditWizard(page, productId);
    await updatePhysicalProductName(page, updatedName);
    await saveEditWizard(page);

    await expect(page).toHaveURL('/dashboard/physical-products', { timeout: 45_000 });

    const { data: row } = await admin.from('products').select('name').eq('id', productId).single();
    expect(row?.name).toBe(updatedName);

    testInfo.attach('edited-physical-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });

  test('service edit wizard saves renamed product', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'service', 'e2e-edit-service');
    const originalName = `Service edit E2E ${ctx.runId}`;
    const updatedName = `${originalName} (modifié)`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openServiceCreateWizard(page);
    await waitForReactApp(page);
    await fillServiceBasicInfoStep(page, { name: originalName });
    await clickServiceWizardNext(page, 1);
    await fillServiceDurationAvailabilityStep(page);
    await clickServiceWizardNext(page, 1);
    await clickServiceWizardNext(page, 2);
    await advanceServiceWizardToPublishStep(page);
    await publishServiceWizard(page);

    const productId = await fetchLatestProductId(admin, ctx.storeId, 'service');
    await openProductEditWizard(page, productId);
    await updateServiceProductName(page, updatedName);
    await saveEditWizard(page);

    await expect(page).toHaveURL('/dashboard/services', { timeout: 45_000 });

    const { data: row } = await admin.from('products').select('name').eq('id', productId).single();
    expect(row?.name).toBe(updatedName);

    testInfo.attach('edited-service-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });

  test('artist edit wizard saves renamed product', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createArtistE2EVendor(admin, 'e2e-edit-artist');
    const originalTitle = `Œuvre edit E2E ${ctx.runId}`;
    const updatedTitle = `${originalTitle} (modifié)`;

    await loginArtistVendor(page, ctx.email, ctx.password);
    await openArtistCreateWizard(page);
    await selectArtistTypeVisual(page);
    await clickArtistWizardNext(page, 1);
    await fillArtistBasicInfoStep(page, { artworkTitle: originalTitle });
    await clickArtistWizardNext(page, 1);
    await advanceArtistWizardToPublishStep(page);
    await publishArtistWizard(page);

    const productId = await fetchLatestProductId(admin, ctx.storeId, 'artist');
    await openProductEditWizard(page, productId);
    await updateArtistArtworkTitle(page, updatedTitle);
    await saveArtistEditWizard(page);

    await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 45_000 });

    const { data: row } = await admin.from('products').select('name').eq('id', productId).single();
    expect(row?.name).toBe(updatedTitle);

    testInfo.attach('edited-artist-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupArtistE2EVendor(admin, ctx, [productId]);
  });
});
