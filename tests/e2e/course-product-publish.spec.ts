/**
 * E2E — Publication cours via wizard (Sprint 2)
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
import { waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Course wizard — publish (E2E)', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'course-product-publish E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('full wizard publish → active course + courses redirect + curriculum rows', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createE2EVendor(admin, 'course', 'e2e-course-pub');
    const courseTitle = `Cours publié E2E ${ctx.runId}`;
    const courseSlug = `cours-e2e-${ctx.runId}`;

    await loginE2EVendor(page, ctx.email, ctx.password, ctx.storeId);
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
      .select(
        `
        id,
        name,
        slug,
        product_type,
        is_draft,
        is_active,
        courses (
          id,
          level,
          language
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'course')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(queryError).toBeNull();
    expect(rows?.length).toBe(1);

    const product = rows![0] as {
      id: string;
      name: string;
      slug: string;
      product_type: string;
      is_draft: boolean;
      is_active: boolean;
      courses: Array<{ id: string; level: string; language: string }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.name).toBe(courseTitle);
    expect(product.slug).toBe(courseSlug);
    expect(product.courses?.[0]?.id).toBeTruthy();

    const courseId = product.courses[0].id;

    const { count: sectionCount } = await admin
      .from('course_sections')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    expect(sectionCount).toBeGreaterThan(0);

    const { count: lessonCount } = await admin
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    expect(lessonCount).toBeGreaterThan(0);

    testInfo.attach('published-course-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupE2EVendor(admin, ctx, [product.id]);
  });
});
