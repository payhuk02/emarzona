/**
 * E2E Sprint 2 — RPC update transactionnels (physical, digital, service).
 *
 * Prérequis : migration 20260706140000 appliquée sur Supabase test.
 * npx playwright test tests/e2e/product-update-rpc.spec.ts
 */
import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';

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

test.describe('Product update RPC — Sprint 2', () => {
  test.setTimeout(90_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'product-update-rpc E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('update_physical_product_tx updates name and physical sku atomically', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-update-physical-${runId}@example.com`;
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
        name: `E2E Update Physical ${runId}`,
        slug: slugify(`e2e-update-physical-${runId}`),
        description: 'E2E update RPC',
        is_active: true,
        commerce_type: 'physical',
      })
      .select('id')
      .single();
    expect(storeError).toBeNull();
    const storeId = (storeData as { id: string }).id;

    const slug = slugify(`physical-${runId}`);
    const { data: createResult, error: createError } = await admin.rpc(
      'create_physical_product_tx',
      {
        p_store_id: storeId,
        p_product: {
          name: `Produit initial ${runId}`,
          slug,
          description: 'Description initiale',
          price: 10000,
          currency: 'XOF',
          is_draft: false,
          is_active: true,
        },
        p_physical: {
          sku: `SKU-INIT-${runId}`,
          track_inventory: true,
          requires_shipping: true,
        },
      }
    );
    expect(createError).toBeNull();

    const created = createResult as {
      product_id: string;
      physical_product_id: string;
    };
    expect(created.product_id).toBeTruthy();

    const updatedName = `Produit mis à jour ${runId}`;
    const updatedSku = `SKU-UPD-${runId}`;

    const { data: updateResult, error: updateError } = await admin.rpc(
      'update_physical_product_tx',
      {
        p_store_id: storeId,
        p_product_id: created.product_id,
        p_product: {
          name: updatedName,
          slug,
          price: 12000,
        },
        p_physical: {
          sku: updatedSku,
        },
      }
    );
    expect(updateError).toBeNull();
    expect((updateResult as { product_id: string }).product_id).toBe(created.product_id);

    const { data: productRow, error: productQueryError } = await admin
      .from('products')
      .select('name, price')
      .eq('id', created.product_id)
      .single();
    expect(productQueryError).toBeNull();
    expect(productRow?.name).toBe(updatedName);
    expect(Number(productRow?.price)).toBe(12000);

    const { data: physicalRow, error: physicalQueryError } = await admin
      .from('physical_products')
      .select('sku')
      .eq('id', created.physical_product_id)
      .single();
    expect(physicalQueryError).toBeNull();
    expect(physicalRow?.sku).toBe(updatedSku);

    await admin.from('products').delete().eq('id', created.product_id);
    await admin.from('stores').delete().eq('id', storeId);
    await admin.auth.admin.deleteUser(userId);
  });

  test('update_digital_product_tx rejects cross-store access', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const { data: userA } = await admin.auth.admin.createUser({
      email: `e2e-digital-a-${runId}@example.com`,
      password: `E2E!${runId}aA1`,
      email_confirm: true,
    });
    const { data: userB } = await admin.auth.admin.createUser({
      email: `e2e-digital-b-${runId}@example.com`,
      password: `E2E!${runId}bB2`,
      email_confirm: true,
    });

    const { data: storeA } = await admin
      .from('stores')
      .insert({
        user_id: userA.user!.id,
        name: `Store A ${runId}`,
        slug: slugify(`store-a-${runId}`),
        is_active: true,
      })
      .select('id')
      .single();

    const { data: storeB } = await admin
      .from('stores')
      .insert({
        user_id: userB.user!.id,
        name: `Store B ${runId}`,
        slug: slugify(`store-b-${runId}`),
        is_active: true,
      })
      .select('id')
      .single();

    const slug = slugify(`digital-${runId}`);
    const { data: createResult } = await admin.rpc('create_digital_product_tx', {
      p_store_id: (storeA as { id: string }).id,
      p_product: {
        name: `Digital ${runId}`,
        slug,
        price: 5000,
        category: 'ebook',
        is_active: true,
        is_draft: false,
      },
      p_digital: {
        digital_type: 'ebook',
        main_file_url: 'https://example.com/file.pdf',
      },
      p_files: [],
    });

    const productId = (createResult as { product_id: string }).product_id;

    const { error: crossStoreError } = await admin.rpc('update_digital_product_tx', {
      p_store_id: (storeB as { id: string }).id,
      p_product_id: productId,
      p_product: { name: 'Hack' },
      p_digital: { version: '9.9' },
    });

    expect(crossStoreError).toBeTruthy();

    await admin.from('products').delete().eq('id', productId);
    await admin
      .from('stores')
      .delete()
      .eq('id', (storeA as { id: string }).id);
    await admin
      .from('stores')
      .delete()
      .eq('id', (storeB as { id: string }).id);
    await admin.auth.admin.deleteUser(userA.user!.id);
    await admin.auth.admin.deleteUser(userB.user!.id);
  });

  test('update_artist_product_tx updates artwork title with server validation', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-update-artist-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;

    const { data: createdUser } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    const userId = createdUser.user!.id;

    const { data: storeData } = await admin
      .from('stores')
      .insert({
        user_id: userId,
        name: `E2E Artist Update ${runId}`,
        slug: slugify(`e2e-artist-upd-${runId}`),
        is_active: true,
        commerce_type: 'artist',
      })
      .select('id')
      .single();
    const storeId = (storeData as { id: string }).id;

    const slug = slugify(`artwork-${runId}`);
    const { data: createResult } = await admin.rpc('create_artist_product_tx', {
      p_store_id: storeId,
      p_product: {
        name: 'Œuvre initiale',
        slug,
        price: 50000,
        currency: 'XOF',
        is_draft: false,
        is_active: true,
      },
      p_artist: {
        artist_type: 'visual_artist',
        artist_name: 'Artiste Test',
        artwork_title: 'Œuvre initiale',
        artwork_year: 2024,
        artwork_medium: 'Huile',
        artwork_dimensions: { width: 50, height: 70, unit: 'cm' },
        artwork_edition_type: 'open_edition',
        requires_shipping: true,
        shipping_handling_time: 3,
        shipping_insurance_amount: 0,
      },
    });

    const productId = (createResult as { product_id: string }).product_id;
    const updatedTitle = `Œuvre mise à jour ${runId}`;

    const { error: updateError } = await admin.rpc('update_artist_product_tx', {
      p_store_id: storeId,
      p_product_id: productId,
      p_product: { name: updatedTitle, price: 55000 },
      p_artist: {
        artist_type: 'visual_artist',
        artist_name: 'Artiste Test',
        artwork_title: updatedTitle,
        artwork_year: 2024,
        artwork_medium: 'Huile',
        artwork_dimensions: { width: 50, height: 70, unit: 'cm' },
        artwork_edition_type: 'open_edition',
        requires_shipping: true,
        shipping_handling_time: 3,
        shipping_insurance_amount: 0,
      },
    });
    expect(updateError).toBeNull();

    const { data: artistRow } = await admin
      .from('artist_products')
      .select('artwork_title')
      .eq('product_id', productId)
      .single();
    expect(artistRow?.artwork_title).toBe(updatedTitle);

    await admin.from('products').delete().eq('id', productId);
    await admin.from('stores').delete().eq('id', storeId);
    await admin.auth.admin.deleteUser(userId);
  });

  test('update_full_course_tx replaces curriculum atomically', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-update-course-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;

    const { data: createdUser } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    const userId = createdUser.user!.id;

    const { data: storeData } = await admin
      .from('stores')
      .insert({
        user_id: userId,
        name: `E2E Course Update ${runId}`,
        slug: slugify(`e2e-course-upd-${runId}`),
        is_active: true,
      })
      .select('id')
      .single();
    const storeId = (storeData as { id: string }).id;

    const slug = slugify(`course-${runId}`);
    const { data: createResult } = await admin.rpc('create_full_course', {
      p_store_id: storeId,
      p_name: `Cours initial ${runId}`,
      p_slug: slug,
      p_short_description: 'Intro',
      p_description: 'Description du cours initial avec assez de contenu.',
      p_category: 'business',
      p_price: 25000,
      p_level: 'beginner',
      p_sections: [
        {
          title: 'Section 1',
          description: null,
          order_index: 0,
          lessons: [
            {
              title: 'Leçon 1',
              description: null,
              order_index: 0,
              video_type: 'upload',
              video_url: 'https://example.com/v1.mp4',
              video_duration_seconds: 120,
              is_preview: false,
            },
          ],
        },
      ],
    });

    const created = createResult as { product_id: string; course_id: string; success: boolean };
    expect(created.success).toBe(true);

    const { error: updateError } = await admin.rpc('update_full_course_tx', {
      p_store_id: storeId,
      p_product_id: created.product_id,
      p_product: {
        name: `Cours mis à jour ${runId}`,
        slug,
        price: 30000,
      },
      p_course: {
        level: 'intermediate',
        language: 'fr',
        certificate_enabled: true,
        certificate_passing_score: 75,
        learning_objectives: ['Objectif A'],
        prerequisites: [],
        target_audience: [],
      },
      p_sections: [
        {
          title: 'Nouvelle section',
          description: null,
          order_index: 0,
          lessons: [
            {
              title: 'Nouvelle leçon',
              description: null,
              order_index: 0,
              video_type: 'upload',
              video_url: 'https://example.com/v2.mp4',
              video_duration_seconds: 180,
              is_preview: true,
            },
            {
              title: 'Leçon 2',
              description: null,
              order_index: 1,
              video_type: 'youtube',
              video_url: 'https://youtube.com/watch?v=test',
              video_duration_seconds: 300,
              is_preview: false,
            },
          ],
        },
      ],
      p_affiliate: { affiliate_enabled: false },
      p_tracking: null,
    });
    expect(updateError).toBeNull();

    const { data: lessons } = await admin
      .from('course_lessons')
      .select('title')
      .eq('course_id', created.course_id)
      .order('order_index', { ascending: true });

    expect(lessons?.map(l => l.title)).toEqual(['Nouvelle leçon', 'Leçon 2']);

    const { data: courseRow } = await admin
      .from('courses')
      .select('level, total_lessons')
      .eq('id', created.course_id)
      .single();
    expect(courseRow?.level).toBe('intermediate');
    expect(courseRow?.total_lessons).toBe(2);

    await admin.from('products').delete().eq('id', created.product_id);
    await admin.from('stores').delete().eq('id', storeId);
    await admin.auth.admin.deleteUser(userId);
  });
});
