/**
 * E2E Sprint 5 — redirect catalogue artiste + création œuvre (RPC transactionnelle).
 *
 * Prérequis : migrations 20260621120000 + 20260622120000 appliquées sur Supabase test.
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
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

const supabaseUrl =
  requiredEnv('VITE_SUPABASE_URL') ??
  requiredEnv('SUPABASE_URL') ??
  requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Artist vendor — redirect & RPC create', () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    if (canRun) return;
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
    const hreflangs = page.locator('link[rel="alternate"][hreflang]');
    await expect(hreflangs).toHaveCount(6, { timeout: 10_000 });
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', /lang=en/);
    await expect(page.locator('link[hreflang="fr-FR"]')).toHaveAttribute('href', /lang=fr/);
  });

  test('artist wizard draft save creates product + artist_products via RPC', async ({
    page,
  }, testInfo) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-artist-rpc-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;
    const artworkTitle = `Œuvre E2E ${runId}`;

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
        name: `E2E Artist RPC ${runId}`,
        slug: slugify(`e2e-artist-rpc-${runId}`),
        description: 'E2E artist RPC create',
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
    await waitForReactApp(page);

    await page.goto('/dashboard/products/new/artist', { waitUntil: 'domcontentloaded' });
    await waitForReactApp(page);

    await page.getByText('Artiste Visuel', { exact: false }).first().click();
    await page.getByRole('button', { name: /suivant/i }).click();

    await page.locator('#artist_name').fill('Artiste E2E');
    await page.locator('#artwork_title').fill(artworkTitle);
    await page.locator('#artwork_medium').fill('Huile sur toile');
    await page.locator('#price').fill('75000');

    const editor = page.locator('[contenteditable="true"]').first();
    if (await editor.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editor.click();
      await editor.fill(
        'Description complète de l’œuvre pour le test E2E avec plus de dix caractères.'
      );
    }

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
      .eq('store_id', storeId)
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
      await admin.from('products').delete().eq('id', product.id);
      await admin.from('stores').delete().eq('id', storeId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // cleanup best-effort
    }
  });
});
