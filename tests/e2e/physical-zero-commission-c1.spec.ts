/**
 * E2E C1 — Commission 0 % sur ventes produits physiques
 *
 * Niveau 1 (toujours) : contrat TypeScript aligné règles métier
 * Niveau 2 (staging)   : validation SQL via RPC order_platform_fee_amount
 *
 * Staging :
 *   E2E_STAGING_SUPABASE_URL=https://xxx.supabase.co
 *   E2E_STAGING_SUPABASE_SERVICE_KEY=eyJ...
 *
 * npx playwright test tests/e2e/physical-zero-commission-c1.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  computeOrderPlatformFeeAmount,
  isCommissionableProductType,
  isPhysicalProductType,
} from '../../src/lib/billing/resolve-order-platform-fee';
import {
  createStagingSupabaseClient,
  findDigitalOnlyPaidOrder,
  findPhysicalOnlyPaidOrder,
  hasStagingSupabaseCredentials,
} from './helpers/supabase-staging';

test.describe('C1 — Contrat commission physical 0 %', () => {
  test('physical product type is not commissionable', () => {
    expect(isPhysicalProductType('physical')).toBe(true);
    expect(isCommissionableProductType('physical')).toBe(false);
  });

  test('physical-only cart yields zero platform fee', () => {
    const result = computeOrderPlatformFeeAmount(
      [{ product_type: 'physical', total_price: 15_000 }],
      10
    );
    expect(result.feeAmount).toBe(0);
    expect(result.commissionableTotal).toBe(0);
    expect(result.physicalTotal).toBe(15_000);
  });

  test('digital-only cart yields 10 % platform fee', () => {
    const result = computeOrderPlatformFeeAmount(
      [{ product_type: 'digital', total_price: 10_000 }],
      10
    );
    expect(result.feeAmount).toBe(1_000);
  });

  test('mixed cart commissions only non-physical lines', () => {
    const result = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 12_500 },
        { product_type: 'service', total_price: 2_500 },
      ],
      10
    );
    expect(result.commissionableTotal).toBe(2_500);
    expect(result.feeAmount).toBe(250);
  });
});

test.describe('C1 — Staging SQL validation', () => {
  test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

  test('commande 100 % physical payée → order_platform_fee_amount = 0', async () => {
    const supabase = createStagingSupabaseClient();
    const physicalOrder = await findPhysicalOnlyPaidOrder(supabase);

    test.skip(!physicalOrder, 'Aucune commande physical-only payée en staging');

    const { data: fee, error } = await supabase.rpc('order_platform_fee_amount', {
      p_order_id: physicalOrder!.orderId,
      p_fee_percent: 10,
    });

    expect(error).toBeNull();
    expect(Number(fee)).toBe(0);
  });

  test('commande 100 % physical → commissionable_amount = 0', async () => {
    const supabase = createStagingSupabaseClient();
    const physicalOrder = await findPhysicalOnlyPaidOrder(supabase);

    test.skip(!physicalOrder, 'Aucune commande physical-only payée en staging');

    const { data: commissionable, error } = await supabase.rpc('order_commissionable_amount', {
      p_order_id: physicalOrder!.orderId,
    });

    expect(error).toBeNull();
    expect(Number(commissionable)).toBe(0);
  });

  test('transaction Stripe/PayPal physical → application_fee_amount = 0 ou null', async () => {
    const supabase = createStagingSupabaseClient();
    const physicalOrder = await findPhysicalOnlyPaidOrder(supabase);

    test.skip(!physicalOrder, 'Aucune commande physical-only payée en staging');

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, application_fee_amount, payment_provider, metadata, status')
      .eq('order_id', physicalOrder!.orderId)
      .eq('status', 'completed')
      .in('payment_provider', ['stripe_connect', 'paypal_commerce']);

    expect(error).toBeNull();

    if (!transactions?.length) {
      test.skip(true, 'Pas de transaction Connect/Commerce pour cette commande (Moneroo wallet OK)');
    }

    for (const tx of transactions ?? []) {
      const fee = Number(tx.application_fee_amount ?? 0);
      expect(fee).toBe(0);
      const meta = tx.metadata as Record<string, unknown> | null;
      expect(Number(meta?.platform_fee_amount ?? 0)).toBe(0);
    }
  });

  test('commande digital payée → fee > 0 en staging', async () => {
    const supabase = createStagingSupabaseClient();
    const digitalOrder = await findDigitalOnlyPaidOrder(supabase);

    test.skip(!digitalOrder, 'Aucune commande digital-only payée en staging');

    const { data: fee, error } = await supabase.rpc('order_platform_fee_amount', {
      p_order_id: digitalOrder!.orderId,
      p_fee_percent: 10,
    });

    expect(error).toBeNull();
    expect(Number(fee)).toBeGreaterThan(0);
  });
});
