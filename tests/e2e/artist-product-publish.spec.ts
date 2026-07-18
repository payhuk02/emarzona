/**
 * E2E — Publication œuvre artiste via wizard (Sprint 1 P0 / audit 2026)
 *
 * Couvre : wizard 8 étapes, upload image, RPC publish, redirect catalogue artiste.
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (Supabase test migré).
 *
 * Exécution :
 *   npx playwright test tests/e2e/artist-product-publish.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  advanceArtistWizardToPublishStep,
  cleanupArtistE2EVendor,
  createArtistE2EVendor,
  fillArtistBasicInfoStep,
  fillArtistEditionStep,
  goToArtistWizardStep,
  loginArtistVendor,
  openArtistCreateWizard,
  publishArtistWizard,
  selectArtistTypeVisual,
  clickArtistWizardNext,
} from './helpers/artist-wizard-helpers';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Artist wizard — publish (E2E)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'artist-product-publish E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('original edition: full wizard publish → active product + artist-products redirect', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createArtistE2EVendor(admin, 'e2e-artist-pub');
    const artworkTitle = `Œuvre publiée E2E ${ctx.runId}`;

    await loginArtistVendor(page, ctx.email, ctx.password);
    await openArtistCreateWizard(page);

    await selectArtistTypeVisual(page);
    await clickArtistWizardNext(page, 1);

    await fillArtistBasicInfoStep(page, { artworkTitle });
    await clickArtistWizardNext(page, 1);

    await advanceArtistWizardToPublishStep(page);
    await publishArtistWizard(page);

    await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /œuvres d'artiste|œuvres/i })).toBeVisible({
      timeout: 15_000,
    });

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
        artist_products (
          artwork_title,
          artist_name,
          artist_type,
          edition_type
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'artist')
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
      artist_products: Array<{
        artwork_title: string;
        artist_name: string;
        artist_type: string;
        edition_type: string;
      }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.product_type).toBe('artist');
    expect(product.slug.length).toBeGreaterThan(0);
    expect(product.artist_products?.[0]?.artwork_title).toBe(artworkTitle);
    expect(product.artist_products?.[0]?.artist_type).toBe('visual_artist');
    expect(product.artist_products?.[0]?.edition_type).toBe('original');

    testInfo.attach('published-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupArtistE2EVendor(admin, ctx, [product.id]);
  });

  test('limited edition: numérotage étape Authentification puis publish', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createArtistE2EVendor(admin, 'e2e-artist-ltd');
    const artworkTitle = `Édition limitée E2E ${ctx.runId}`;

    await loginArtistVendor(page, ctx.email, ctx.password);
    await openArtistCreateWizard(page);

    await selectArtistTypeVisual(page);
    await clickArtistWizardNext(page, 1);

    await fillArtistBasicInfoStep(page, {
      artworkTitle,
      editionType: 'limited_edition',
    });
    await clickArtistWizardNext(page, 1);

    // Étapes 3–4 puis Authentification (5)
    await goToArtistWizardStep(page, 5);
    await fillArtistEditionStep(page, 3, 25);
    await clickArtistWizardNext(page, 1);

    // Étapes 6–7 puis publish
    await advanceArtistWizardToPublishStep(page);
    await publishArtistWizard(page);

    await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 30_000 });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select(
        `
        id,
        is_draft,
        is_active,
        artist_products (
          edition_type,
          edition_number,
          total_editions
        )
      `
      )
      .eq('store_id', ctx.storeId)
      .eq('product_type', 'artist')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(queryError).toBeNull();
    expect(rows?.length).toBe(1);

    const product = rows![0] as {
      id: string;
      is_draft: boolean;
      is_active: boolean;
      artist_products: Array<{
        edition_type: string;
        edition_number: number;
        total_editions: number;
      }>;
    };

    expect(product.is_draft).toBe(false);
    expect(product.is_active).toBe(true);
    expect(product.artist_products?.[0]?.edition_type).toBe('limited_edition');
    expect(product.artist_products?.[0]?.edition_number).toBe(3);
    expect(product.artist_products?.[0]?.total_editions).toBe(25);

    testInfo.attach('limited-edition-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    await cleanupArtistE2EVendor(admin, ctx, [product.id]);
  });
});
