/**
 * E2E Sprint 5 — redirect catalogue artiste + création œuvre (RPC transactionnelle).
 *
 * Prérequis : migrations 20260621120000 + 20260622120000 appliquées sur Supabase test.
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  cleanupArtistE2EVendor,
  createArtistE2EVendor,
  fillArtistBasicInfoStep,
  loginArtistVendor,
  openArtistCreateWizard,
  selectArtistTypeVisual,
  clickArtistWizardNext,
} from './helpers/artist-wizard-helpers';
import { gotoApp, waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Artist vendor — redirect & RPC create', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'artist-product-create-rpc E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('artist store: /dashboard/products redirects to /dashboard/artist-products', async ({
    page,
  }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-artist-redirect-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(userError).toBeNull();
    const userId = createdUser.user!.id;

    const { data: storeData, error: storeError } = await admin
      .from('stores')
      .insert({
        user_id: userId,
        name: `E2E Artist ${runId}`,
        slug: slugify(`e2e-artist-${runId}`),
        description: 'E2E artist redirect',
        is_active: true,
        commerce_type: 'artist',
        metadata: { commerce_type: 'artist' },
      })
      .select('id')
      .single();
    expect(storeError).toBeNull();
    const storeId = (storeData as { id: string }).id;

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard', { timeout: 20_000 });

    await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/dashboard/artist-products', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /œuvres d'artiste|œuvres/i })).toBeVisible({
      timeout: 15_000,
    });

    await admin.from('stores').delete().eq('id', storeId);
    await admin.auth.admin.deleteUser(userId);
  });

  test('landing homepage exposes multilingual hreflang alternates', async ({ page }) => {
    await gotoApp(page, '/');
    // index.html + SEOMeta may briefly coexist; assert required locales rather than brittle total count.
    await expect(page.locator('link[hreflang="en"]').first()).toHaveAttribute('href', /lang=en/, {
      timeout: 10_000,
    });
    await expect(page.locator('link[hreflang="fr-FR"]').first()).toHaveAttribute(
      'href',
      /https?:\/\/[^/]+\/?$/
    );
    await expect(page.locator('link[hreflang="es"]').first()).toBeAttached();
    await expect(page.locator('link[hreflang="de"]').first()).toBeAttached();
    await expect(page.locator('link[hreflang="pt-BR"]').first()).toBeAttached();
    await expect(page.locator('link[hreflang="x-default"]').first()).toBeAttached();
  });

  test('artist wizard draft save creates product + artist_products via RPC', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const ctx = await createArtistE2EVendor(admin, 'e2e-artist-rpc');
    const artworkTitle = `Œuvre E2E ${ctx.runId}`;

    await loginArtistVendor(page, ctx.email, ctx.password);
    await openArtistCreateWizard(page);

    await selectArtistTypeVisual(page);
    await clickArtistWizardNext(page, 1);

    await fillArtistBasicInfoStep(page, { artworkTitle, price: '75000' });

    await page.getByRole('button', { name: /brouillon/i }).click();

    await expect(page.getByText(/brouillon sauvegardé|succès/i).first()).toBeVisible({
      timeout: 30_000,
    });

    const { data: rows, error: queryError } = await admin
      .from('products')
      .select(
        `
        id,
        product_type,
        name,
        is_draft,
        artist_products (
          artwork_title,
          artist_name,
          artist_type
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
      product_type: string;
      name: string;
      is_draft: boolean;
      artist_products: Array<{
        artwork_title: string;
        artist_name: string;
        artist_type: string;
      }>;
    };

    expect(product.product_type).toBe('artist');
    expect(product.is_draft).toBe(true);
    expect(product.artist_products?.[0]?.artwork_title).toBe(artworkTitle);
    expect(product.artist_products?.[0]?.artist_name).toBe('Artiste E2E');
    expect(product.artist_products?.[0]?.artist_type).toBe('visual_artist');

    testInfo.attach('created-product-id', {
      body: product.id,
      contentType: 'text/plain',
    });

    try {
      await cleanupArtistE2EVendor(admin, ctx, [product.id]);
    } catch {
      // cleanup best-effort
    }
  });
});
