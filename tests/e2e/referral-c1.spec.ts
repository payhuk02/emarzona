/**
 * E2E Epic 2.3.3 — Referral commission alignée C1 (base commissionnable)
 *
 * Niveau 1 : contrat TypeScript
 * Niveau 2 : validation SQL staging (calculate_referral_commission + order_commissionable_amount)
 *
 * npx playwright test tests/e2e/referral-c1.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  computeOrderPlatformFeeAmount,
  isCommissionableProductType,
} from '../../src/lib/billing/resolve-order-platform-fee';
import {
  createStagingSupabaseClient,
  hasStagingSupabaseCredentials,
} from './helpers/supabase-staging';

test.describe('Referral C1 — Contrat base commissionnable', () => {
  test('physical lines are excluded from commissionable base', () => {
    expect(isCommissionableProductType('physical')).toBe(false);
    expect(isCommissionableProductType('service')).toBe(true);
  });

  test('mixed cart referral base excludes physical amount', () => {
    const result = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 20_000 },
        { product_type: 'digital', total_price: 5_000 },
      ],
      10
    );
    expect(result.commissionableTotal).toBe(5_000);
    expect(result.physicalTotal).toBe(20_000);
    expect(result.feeAmount).toBe(500);
  });

  test('referral 2% would apply on commissionable only (simulation)', () => {
    const { commissionableTotal } = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 100_000 },
        { product_type: 'course', total_price: 10_000 },
      ],
      10
    );
    const referralRate = 0.02;
    expect(Math.round(commissionableTotal * referralRate)).toBe(200);
  });
});

test.describe('Referral C1 — Staging SQL validation', () => {
  test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

  test('order_commissionable_amount disponible sur commande payée', async () => {
    const supabase = createStagingSupabaseClient();

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);

    test.skip(!orders?.length, 'Aucune commande payée en staging');

    const { data: commissionable, error: rpcError } = await supabase.rpc(
      'order_commissionable_amount',
      { p_order_id: orders![0].id }
    );

    expect(rpcError).toBeNull();
    expect(Number(commissionable)).toBeGreaterThanOrEqual(0);
  });
});
