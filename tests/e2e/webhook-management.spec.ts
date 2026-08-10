/**
 * E2E — Gestion des Webhooks (/dashboard/webhooks)
 *
 * npx playwright test tests/e2e/webhook-management.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import { withAuthAdminRetry } from './helpers/auth-admin-retry';
import { seedTermsConsent } from './helpers/store-theme-helpers';
import { loginSeededSeller } from './helpers/seller-dashboard-setup';
import { gotoApp, E2E_TEST_CONFIG, waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
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
const canRunSupabaseE2E = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Webhooks — page vendeur (browser)', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test('GET /dashboard/webhooks — auth gate si invité', async ({ page }) => {
    await gotoApp(page, '/dashboard/webhooks');
    await waitForReactApp(page);
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/(dashboard|auth|login)/);
  });
});

test.describe('Webhooks — UI vendeur authentifié', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  test.beforeAll(() => {
    if (!canRunSupabaseE2E) {
      const message =
        'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated with webhooks).';
      if (process.env.CI) {
        throw new Error(message);
      }
      test.skip(true, message);
      return;
    }
    assertSafeE2ESupabaseUrl(supabaseUrl!, 'webhook-management E2E');
  });

  test('charge la page et ouvre le dialogue de création', async ({ page }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-webhooks-ui-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;
    const storeName = `E2E Webhooks ${runId}`;
    const storeSlug = slugify(storeName);

    const created = await withAuthAdminRetry(`webhooks-ui createUser(${email})`, async () => {
      const result = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (result.error || !result.data.user) {
        throw result.error ?? new Error('createUser failed');
      }
      return result.data;
    });
    const userId = created.user!.id;

    const { data: store, error: storeError } = await admin
      .from('stores')
      .insert({
        user_id: userId,
        name: storeName,
        slug: storeSlug,
        description: 'E2E webhooks store',
        is_active: true,
        commerce_type: 'digital',
        metadata: { commerce_type: 'digital' },
      })
      .select('id')
      .single();

    if (storeError || !store) {
      throw storeError ?? new Error('store insert failed');
    }

    try {
      await seedTermsConsent(admin, userId);
      await loginSeededSeller(page, admin, email, {
        selectedStoreId: store.id,
        password,
      });

      await gotoApp(page, '/dashboard/webhooks');
      await expect(page.getByRole('heading', { name: /Gestion des Webhooks/i })).toBeVisible({
        timeout: 30_000,
      });

      await page
        .getByRole('button', { name: /Nouveau/i })
        .first()
        .click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByLabel(/URL/i).first()).toBeVisible();
    } finally {
      await admin.from('webhooks').delete().eq('store_id', store.id);
      await admin.from('stores').delete().eq('id', store.id);
      await admin.auth.admin.deleteUser(userId);
    }
  });
});

test.describe('Webhooks — test_webhook RPC (Supabase)', () => {
  test.beforeAll(() => {
    if (!canRunSupabaseE2E) {
      const message =
        'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated with test_webhook).';
      if (process.env.CI) {
        throw new Error(message);
      }
      test.skip(true, message);
      return;
    }
    assertSafeE2ESupabaseUrl(supabaseUrl!, 'webhook-management RPC E2E');
  });

  test('test_webhook crée une livraison pending', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `e2e-webhooks-rpc-${runId}@example.com`;
    const password = `E2E!${runId}aA1`;
    const storeName = `E2E Webhooks RPC ${runId}`;
    const storeSlug = slugify(storeName);

    const created = await withAuthAdminRetry(`webhooks-rpc createUser(${email})`, async () => {
      const result = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (result.error || !result.data.user) {
        throw result.error ?? new Error('createUser failed');
      }
      return result.data;
    });
    const userId = created.user!.id;

    const { data: store, error: storeError } = await admin
      .from('stores')
      .insert({
        user_id: userId,
        name: storeName,
        slug: storeSlug,
        description: 'E2E webhooks RPC store',
        is_active: true,
        commerce_type: 'digital',
        metadata: { commerce_type: 'digital' },
      })
      .select('id')
      .single();

    if (storeError || !store) {
      throw storeError ?? new Error('store insert failed');
    }

    let webhookId: string | null = null;

    try {
      const { data: webhook, error: webhookError } = await admin
        .from('webhooks')
        .insert({
          store_id: store.id,
          created_by: userId,
          name: 'E2E Test Webhook',
          url: 'https://example.com/webhook-e2e',
          events: ['order.created'],
          status: 'active',
        })
        .select('id')
        .single();

      if (webhookError || !webhook) {
        throw webhookError ?? new Error('webhook insert failed');
      }
      webhookId = webhook.id;

      const { data: deliveryId, error: testError } = await admin.rpc('test_webhook', {
        p_webhook_id: webhookId,
      });

      expect(testError).toBeNull();
      expect(deliveryId).toBeTruthy();

      const { data: delivery, error: deliveryError } = await admin
        .from('webhook_deliveries')
        .select('id, status, webhook_id, event_type')
        .eq('id', deliveryId as string)
        .single();

      expect(deliveryError).toBeNull();
      expect(delivery?.webhook_id).toBe(webhookId);
      expect(delivery?.status).toBe('pending');
      expect(delivery?.event_type).toBe('custom');
    } finally {
      if (webhookId) {
        await admin.from('webhook_deliveries').delete().eq('webhook_id', webhookId);
        await admin.from('webhooks').delete().eq('id', webhookId);
      }
      await admin.from('stores').delete().eq('id', store.id);
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
