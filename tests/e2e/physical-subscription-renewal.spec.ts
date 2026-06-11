/**
 * E2E Epic 2.1.2 — Renouvellement abonnement vendeur physique (auto-renew queue)
 *
 * Staging :
 *   E2E_STAGING_SUPABASE_URL
 *   E2E_STAGING_SUPABASE_SERVICE_KEY
 *
 * npx playwright test tests/e2e/physical-subscription-renewal.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  createStagingSupabaseClient,
  hasStagingSupabaseCredentials,
} from './helpers/supabase-staging';

test.describe('Epic 2.1.2 — Renouvellement abonnement physique', () => {
  test('RPC list_subscriptions_for_auto_renewal retourne un tableau JSON', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data, error } = await supabase.rpc('list_subscriptions_for_auto_renewal');

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  test('mandates auto_renew_enabled ont customer_email', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: mandates, error } = await supabase
      .from('subscription_billing_mandates')
      .select('id, auto_renew_enabled, customer_email, subscription_id')
      .eq('auto_renew_enabled', true)
      .limit(20);

    expect(error).toBeNull();
    test.skip(!mandates?.length, 'Aucun mandate auto_renew en staging');

    for (const m of mandates ?? []) {
      expect(m.customer_email, `mandate ${m.id}`).toBeTruthy();
      expect(m.subscription_id).toBeTruthy();
    }
  });

  test('abonnements past_due ont une facture pending ou période expirée', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: subs, error } = await supabase
      .from('store_platform_subscriptions')
      .select('id, status, current_period_end')
      .eq('status', 'past_due')
      .limit(10);

    expect(error).toBeNull();
    test.skip(!subs?.length, 'Aucun abonnement past_due en staging');

    for (const sub of subs ?? []) {
      const { data: invoices } = await supabase
        .from('subscription_invoices')
        .select('id, status')
        .eq('subscription_id', sub.id)
        .eq('status', 'pending')
        .limit(1);

      const hasPendingInvoice = (invoices?.length ?? 0) > 0;
      const periodExpired =
        sub.current_period_end != null && new Date(sub.current_period_end) <= new Date();

      expect(
        hasPendingInvoice || periodExpired,
        `past_due ${sub.id} sans facture pending ni période expirée`
      ).toBe(true);
    }
  });

  test('set_subscription_auto_renew est callable sur une boutique active', async () => {
    test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

    const supabase = createStagingSupabaseClient();
    const { data: row, error: fetchError } = await supabase
      .from('store_platform_subscriptions')
      .select('store_id, id')
      .in('status', ['active', 'past_due', 'trialing'])
      .limit(1)
      .maybeSingle();

    expect(fetchError).toBeNull();
    test.skip(!row?.store_id, 'Aucune boutique avec abonnement actif en staging');

    const { data: enabled, error: onError } = await supabase.rpc('set_subscription_auto_renew', {
      p_store_id: row.store_id,
      p_enabled: true,
    });
    expect(onError).toBeNull();
    expect(enabled).toBe(true);

    const { data: mandate } = await supabase
      .from('subscription_billing_mandates')
      .select('auto_renew_enabled')
      .eq('subscription_id', row.id)
      .maybeSingle();

    if (mandate) {
      expect(mandate.auto_renew_enabled).toBe(true);
    }
  });
});
