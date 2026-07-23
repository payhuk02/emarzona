/**
 * E2E — Visibilité marketplace après publication wizard (Sprint 3)
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
import { assertGuestMarketplaceProductVisible } from './shared/marketplace-discovery';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

async function fetchLatestPublishedProduct(
  admin: SupabaseClient,
  storeId: string,
  productType: string
): Promise<{ id: string; name: string }> {
  const { data: rows, error } = await admin
    .from('products')
    .select('id, name, is_draft, is_active')
    .eq('store_id', storeId)
    .eq('product_type', productType)
    .order('created_at', { ascending: false })
    .limit(1);

  expect(error).toBeNull();
  expect(rows?.length).toBe(1);

  const product = rows![0] as { id: string; name: string; is_draft: boolean; is_active: boolean };
  expect(product.is_draft).toBe(false);
  expect(product.is_active).toBe(true);
  return { id: product.id, name: product.name };
}

test.describe('Marketplace — product visibility after wizard publish (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'marketplace-product-visibility E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('published course appears in marketplace catalog and guest buy CTA', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'course', 'e2e-mp-course');
    const courseTitle = `Cours marketplace E2E ${ctx.runId}`;
    const courseSlug = `cours-mp-e2e-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openCourseCreateWizard(page);
    await waitForReactApp(page);

    await fillCourseBasicInfoStep(page, { title: courseTitle, slug: courseSlug });
    await clickCourseWizardNext(page, 1);
    await fillCourseCurriculumStep(page);
    await clickCourseWizardNext(page, 1);
    await advanceCourseWizardToPublishStep(page);
    await publishCourseWizard(page);

    await expect(page).toHaveURL('/dashboard/courses', { timeout: 45_000 });

    const product = await fetchLatestPublishedProduct(admin, ctx.storeId, 'course');
    expect(product.name).toBe(courseTitle);

    await assertGuestMarketplaceProductVisible(
      page,
      admin,
      product.id,
      courseTitle,
      /S'inscrire|inscrire/i
    );

    testInfo.attach('marketplace-visible-course-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('published digital appears in marketplace catalog and guest buy CTA', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-mp-digital');
    const productName = `Digital marketplace E2E ${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openDigitalCreateWizard(page);
    await waitForReactApp(page);

    await fillDigitalBasicInfoStep(page, { name: productName });
    await clickWizardNext(page, 1);
    await fillDigitalMainFileUrlStep(page);
    await clickWizardNext(page, 1);
    await advanceDigitalWizardToPublishStep(page);
    await publishDigitalWizard(page);

    await expect(page).toHaveURL('/dashboard/digital-products', { timeout: 45_000 });

    const product = await fetchLatestPublishedProduct(admin, ctx.storeId, 'digital');
    expect(product.name).toBe(productName);

    await assertGuestMarketplaceProductVisible(page, admin, product.id, productName, /Acheter/i);

    testInfo.attach('marketplace-visible-digital-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('published physical appears in marketplace catalog and guest buy CTA', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'physical', 'e2e-mp-physical');
    const productName = `Physique marketplace E2E ${ctx.runId}`;
    const sku = `E2E-MP-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openPhysicalCreateWizard(page);
    await waitForReactApp(page);

    await fillPhysicalBasicInfoStep(page, { name: productName });
    await clickPhysicalWizardNext(page, 1);
    await clickPhysicalWizardNext(page, 1);
    await fillPhysicalInventoryStep(page, { sku, quantity: '25' });
    await clickPhysicalWizardNext(page, 1);
    await fillPhysicalShippingStep(page, '1.5');
    await clickPhysicalWizardNext(page, 1);
    await advancePhysicalWizardToPublishStep(page);
    await publishPhysicalWizard(page);

    await expect(page).toHaveURL('/dashboard/physical-products', { timeout: 45_000 });

    const product = await fetchLatestPublishedProduct(admin, ctx.storeId, 'physical');
    expect(product.name).toBe(productName);

    await assertGuestMarketplaceProductVisible(page, admin, product.id, productName, /Commander/i);

    testInfo.attach('marketplace-visible-physical-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('published service appears in marketplace catalog and guest buy CTA', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'service', 'e2e-mp-service');
    const serviceName = `Service marketplace E2E ${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openServiceCreateWizard(page);
    await waitForReactApp(page);

    await fillServiceBasicInfoStep(page, { name: serviceName });
    await clickServiceWizardNext(page, 1);
    await fillServiceDurationAvailabilityStep(page, {
      locationAddress: `12 avenue E2E ${ctx.runId}, Abidjan`,
    });
    await clickServiceWizardNext(page, 1);
    await clickServiceWizardNext(page, 2);
    await advanceServiceWizardToPublishStep(page);
    await publishServiceWizard(page);

    await expect(page).toHaveURL('/dashboard/services', { timeout: 45_000 });

    const product = await fetchLatestPublishedProduct(admin, ctx.storeId, 'service');
    expect(product.name).toBe(serviceName);

    await assertGuestMarketplaceProductVisible(page, admin, product.id, serviceName, /Réserver/i);

    testInfo.attach('marketplace-visible-service-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });

  test('published artist appears in marketplace catalog and guest buy CTA', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createArtistE2EVendor(admin, 'e2e-mp-artist');
    const artworkTitle = `Œuvre marketplace E2E ${ctx.runId}`;

    await loginArtistVendor(page, ctx.email, ctx.password);
    await openArtistCreateWizard(page);

    await selectArtistTypeVisual(page);
    await clickArtistWizardNext(page, 1);
    await fillArtistBasicInfoStep(page, { artworkTitle });
    await clickArtistWizardNext(page, 1);
    await advanceArtistWizardToPublishStep(page);
    await publishArtistWizard(page);

    await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 45_000 });

    const product = await fetchLatestPublishedProduct(admin, ctx.storeId, 'artist');
    expect(product.name).toBe(artworkTitle);

    await assertGuestMarketplaceProductVisible(page, admin, product.id, artworkTitle, /Acheter/i);

    testInfo.attach('marketplace-visible-artist-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupArtistE2EVendor(admin, ctx, [product.id]);
  });
});
