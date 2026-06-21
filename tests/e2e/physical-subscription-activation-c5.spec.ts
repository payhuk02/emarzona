/**
 * E2E C5 — Activation abonnement vendeur physique (upsert webhook Moneroo)
 *
 * Staging :
 *   E2E_STAGING_SUPABASE_URL
 *   E2E_STAGING_SUPABASE_SERVICE_KEY
 *
 * npx playwright test tests/e2e/physical-subscription-activation-c5.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  createStagingSupabaseClient,
  hasStagingSupabaseCredentials,
} from './helpers/supabase-staging';

test.describe('C5 — Contrat abonnement physique', () => {
  test('plans vendeur physical ont les prix attendus (25/49/79 USD)', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: plans, error } = await supabase
      .from('platform_vendor_plans')
      .select('slug, monthly_price, currency, applies_to_product_type, is_active')
      .in('slug', ['physical_basic', 'physical_standard', 'physical_premium'])
      .eq('is_active', true);

    expect(error).toBeNull();
    expect(plans?.length).toBe(3);

    const bySlug = Object.fromEntries((plans ?? []).map(p => [p.slug, p]));
    expect(Number(bySlug.physical_basic.monthly_price)).toBe(25);
    expect(Number(bySlug.physical_standard.monthly_price)).toBe(49);
    expect(Number(bySlug.physical_premium.monthly_price)).toBe(79);
    expect(bySlug.physical_basic.currency).toBe('USD');

    for (const plan of plans ?? []) {
      expect(plan.applies_to_product_type).toBe('physical');
    }
  });

  test('stores actifs ont une row store_platform_subscriptions (post-trial seed)', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(5);

    expect(storesError).toBeNull();
    test.skip(!stores?.length, 'Aucune boutique en staging');

    const storeIds = stores!.map(s => s.id);
    const { data: subs, error: subsError } = await supabase
      .from('store_platform_subscriptions')
      .select('store_id, status, plan_id, mrr_amount')
      .in('store_id', storeIds);

    expect(subsError).toBeNull();

    const covered = new Set((subs ?? []).map(s => s.store_id));
    const orphanStores = storeIds.filter(id => !covered.has(id));

    expect(
      orphanStores,
      `Stores sans abonnement plateforme (risque C5) : ${orphanStores.join(', ')}`
    ).toEqual([]);
  });

  test('abonnements activés via moneroo_webhook ont status active', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: subs, error } = await supabase
      .from('store_platform_subscriptions')
      .select('id, store_id, status, payment_provider, metadata')
      .contains('metadata', { activated_via: 'moneroo_webhook' })
      .limit(10);

    expect(error).toBeNull();
    test.skip(
      !subs?.length,
      'Aucun abonnement activé via webhook en staging (OK si pas encore de paiement)'
    );

    for (const sub of subs ?? []) {
      expect(sub.status).toBe('active');
      expect(sub.payment_provider).toBe('moneroo_platform');
    }
  });
});
