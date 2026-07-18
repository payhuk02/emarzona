/**
 * E2E — Visibilité marketplace après publication wizard (Sprint 3)
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
  clickWizardNext,
} from './helpers/course-wizard-helpers';
import { cleanupE2EVendor, createE2EVendor, loginE2EVendor } from './helpers/vendor-e2e-helpers';
import {
  assertProductListedInMarketplaceQuery,
  searchMarketplaceForProduct,
} from './shared/marketplace-discovery';
import { gotoApp, waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Marketplace — product visibility after wizard publish (E2E)', () => {
  test.setTimeout(300_000);

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

  test('published course appears in marketplace catalog query and UI search', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'course', 'e2e-mp-vis');
    const courseTitle = `Cours marketplace E2E ${ctx.runId}`;
    const courseSlug = `cours-mp-e2e-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password);
    await openCourseCreateWizard(page);
    await waitForReactApp(page);

    await fillCourseBasicInfoStep(page, { title: courseTitle, slug: courseSlug });
    await clickWizardNext(page, 1);
    await fillCourseCurriculumStep(page);
    await clickWizardNext(page, 1);
    await advanceCourseWizardToPublishStep(page);
    await publishCourseWizard(page);

    await expect(page).toHaveURL('/dashboard/courses', { timeout: 45_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select('id, name, slug, product_type, is_draft, is_active, category')
      .eq('store_id', ctx.storeId)
      .eq('slug', courseSlug)
      .limit(1);

    expect(queryError).toBeNull();
    expect(rows?.length).toBe(1);

    const product = rows![0] as {
      id: string;
      name: string;
      is_draft: boolean;
      is_active: boolean;
      category: string | null;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(courseTitle);

    await assertProductListedInMarketplaceQuery(admin, product.id, courseTitle);

    await page.context().clearCookies();
    await gotoApp(page, '/marketplace');
    await searchMarketplaceForProduct(page, courseTitle);

    await expect(
      page.getByTestId('product-card').filter({ hasText: courseTitle }).first()
    ).toBeVisible({
      timeout: 30_000,
    });

    testInfo.attach('marketplace-visible-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });
});
