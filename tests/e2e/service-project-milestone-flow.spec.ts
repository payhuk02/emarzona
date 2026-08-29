/**
 * E2E — Service projet P0→P3 : taxonomie projet, packages P1, jalons P3, cycle paiement complet.
 * API Supabase (pas de navigateur requis) — config playwright.service-milestone.config.ts
 */
import { test } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import { runServiceMilestoneP0P3Flow } from './helpers/service-milestone-flow-run';
import {
  assertServiceMilestoneSchemaReady,
  cleanupServiceMilestoneFixture,
  seedServiceMilestoneFixture,
} from './helpers/service-milestone-seed';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRun = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Service projet — jalons P0→P3 (E2E API)', () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    if (canRun) {
      assertSafeE2ESupabaseUrl(supabaseUrl!, 'service-project-milestone-flow E2E');
      return;
    }
    const message =
      'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated).';
    if (process.env.CI) {
      throw new Error(message);
    }
    test.skip(true, message);
  });

  test('P0–P3: projet + package + commande + jalons held → livraison → solde paid', async () => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);
    await assertServiceMilestoneSchemaReady(admin);
    const fixture = await seedServiceMilestoneFixture(admin);
    let orderId: string | null = null;

    try {
      orderId = await runServiceMilestoneP0P3Flow(admin, fixture);
    } finally {
      if (orderId) {
        await admin.from('service_order_milestones').delete().eq('order_id', orderId);
        await admin.from('order_items').delete().eq('order_id', orderId);
        await admin.from('orders').delete().eq('id', orderId);
      }
      await cleanupServiceMilestoneFixture(admin, fixture);
    }
  });
});
