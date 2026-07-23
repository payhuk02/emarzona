/**
 * E2E — Wizard publish → marketplace invité → checkout (digital + course)
 */
import { test, expect } from '@playwright/test';
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
  cleanupE2EVendor,
  createE2EVendor,
  loginE2EVendor,
  clickWizardNext,
} from './helpers/vendor-e2e-helpers';
import {
  assertGuestMarketplaceProductVisible,
  completeMarketplaceGuestPurchaseFromCard,
} from './shared/marketplace-discovery';
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Marketplace — wizard publish to guest checkout (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'marketplace-wizard-checkout E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('digital: publish wizard → marketplace → guest checkout', async ({ page }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'digital', 'e2e-mp-checkout-digital');
    const productName = `Digital checkout E2E ${ctx.runId}`;
    const guestEmail = `guest-digital-${ctx.runId}@example.com`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openDigitalCreateWizard(page);
    await waitForReactApp(page);
    await fillDigitalBasicInfoStep(page, { name: productName });
    await clickWizardNext(page, 1);
    await fillDigitalMainFileUrlStep(page);
    await clickWizardNext(page, 1);
    await advanceDigitalWizardToPublishStep(page);
    await publishDigitalWizard(page);

    const { data: rows } = await admin
      .from('products')
      .select('id')
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'digital')
      .order('created_at', { ascending: false })
      .limit(1);
    const productId = (rows![0] as { id: string }).id;

    await assertGuestMarketplaceProductVisible(page, admin, productId, productName, /Acheter/i);
    await completeMarketplaceGuestPurchaseFromCard(page, productName, {
      guestEmail,
      guestName: 'Acheteur E2E',
      expectedUrl: /\/checkout/,
    });
    expect(page.url()).toContain(`productId=${productId}`);

    testInfo.attach('digital-checkout-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });

  test('course: publish wizard → marketplace → guest course enrollment page', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'course', 'e2e-mp-checkout-course');
    const courseTitle = `Cours checkout E2E ${ctx.runId}`;
    const courseSlug = `cours-checkout-e2e-${ctx.runId}`;
    const guestEmail = `guest-course-${ctx.runId}@example.com`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
    await openCourseCreateWizard(page);
    await waitForReactApp(page);
    await fillCourseBasicInfoStep(page, { title: courseTitle, slug: courseSlug });
    await clickCourseWizardNext(page, 1);
    await fillCourseCurriculumStep(page);
    await clickCourseWizardNext(page, 1);
    await advanceCourseWizardToPublishStep(page);
    await publishCourseWizard(page);

    const { data: rows } = await admin
      .from('products')
      .select('id')
      .eq('store_id', ctx.storeId)
      .eq('slug', courseSlug)
      .limit(1);
    const productId = (rows![0] as { id: string }).id;

    await assertGuestMarketplaceProductVisible(
      page,
      admin,
      productId,
      courseTitle,
      /S'inscrire|inscrire/i
    );
    await completeMarketplaceGuestPurchaseFromCard(page, courseTitle, {
      guestEmail,
      guestName: 'Étudiant E2E',
      expectedUrl: /\/courses\//,
    });
    expect(page.url()).toContain(`guestEmail=${encodeURIComponent(guestEmail)}`);

    testInfo.attach('course-checkout-product-id', { body: productId, contentType: 'text/plain' });
    await cleanupE2EVendor(admin, ctx, [productId]);
  });
});
