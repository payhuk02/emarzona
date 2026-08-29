/**
 * E2E P2 — Service projet (navigateur) : session vendeur + parcours API P0→P3.
 *
 * PaymentManagement détaillé nécessite RLS orders côté vendeur sur E2E (en cours).
 * Ce test valide : seed API → flow jalons → dashboard vendeur authentifié.
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import { runServiceMilestoneP0P3Flow } from './helpers/service-milestone-flow-run';
import {
  cleanupServiceMilestoneFixture,
  seedServiceMilestoneFixture,
} from './helpers/service-milestone-seed';
import { injectVendorAuthSession } from './helpers/vendor-e2e-helpers';
import { gotoApp, waitForReactApp } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const canRun = Boolean(supabaseUrl && supabaseServiceKey && supabaseAnonKey);

test.describe('Service projet — P2 navigateur + API', () => {
  test.setTimeout(300_000);
  test.use({ navigationTimeout: 90_000, actionTimeout: 30_000 });

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'service-project-p2 E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('API P0→P3 puis dashboard vendeur authentifié', async ({ page }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    const fixture = await seedServiceMilestoneFixture(admin, 'e2e-svc-p2');

    try {
      const orderId = await runServiceMilestoneP0P3Flow(admin, fixture);

      const { data: orderRow } = await admin
        .from('orders')
        .select('id, store_id, payment_status')
        .eq('id', orderId)
        .single();
      expect(orderRow?.store_id).toBe(fixture.storeId);
      expect(orderRow?.payment_status).toBe('completed');

      const authClient = createClient(supabaseUrl!, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: signInError } = await authClient.auth.signInWithPassword({
        email: fixture.email,
        password: fixture.password,
      });
      expect(signInError).toBeNull();

      await injectVendorAuthSession(
        page,
        fixture.email,
        fixture.password,
        fixture.storeId,
        supabaseAnonKey
      );
      await gotoApp(page, '/dashboard');
      await waitForReactApp(page);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    } finally {
      await cleanupServiceMilestoneFixture(admin, fixture);
    }
  });
});
