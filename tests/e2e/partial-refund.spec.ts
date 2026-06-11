/**
 * E2E Epic 2.3 — Remboursements partiels (contrat + staging SQL)
 *
 * Niveau 1 (toujours) : règles métier remboursement partiel
 * Niveau 2 (staging)   : apply_transaction_refund via RPC service role
 *
 * Staging :
 *   E2E_STAGING_SUPABASE_URL
 *   E2E_STAGING_SUPABASE_SERVICE_KEY
 *
 * npx playwright test tests/e2e/partial-refund.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  createStagingSupabaseClient,
  hasStagingSupabaseCredentials,
} from './helpers/supabase-staging';
import {
  applyPartialRefundRpc,
  cleanupPartialRefundFixture,
  seedPartialRefundFixture,
} from './helpers/financial-staging';

/** Aligné sur apply_transaction_refund SQL (seuil full refund : amount - 0.01) */
function computeRefundStatus(
  txAmount: number,
  cumulativeRefunded: number
): 'partially_refunded' | 'refunded' {
  if (cumulativeRefunded >= txAmount - 0.01) return 'refunded';
  return 'partially_refunded';
}

function computeOrderNetRevenue(totalAmount: number, refundedAmount: number): number {
  return Math.max(totalAmount - refundedAmount, 0);
}

test.describe('Epic 2.3 — Contrat remboursement partiel', () => {
  test('statut partially_refunded si remboursement < montant transaction', () => {
    expect(computeRefundStatus(10_000, 3_000)).toBe('partially_refunded');
  });

  test('statut refunded si remboursement cumulé = montant transaction', () => {
    expect(computeRefundStatus(10_000, 10_000)).toBe('refunded');
    expect(computeRefundStatus(10_000, 9_999.99)).toBe('refunded');
    expect(computeRefundStatus(10_000, 9_998)).toBe('partially_refunded');
  });

  test('revenu net commande diminue avec refunded_amount', () => {
    expect(computeOrderNetRevenue(10_000, 0)).toBe(10_000);
    expect(computeOrderNetRevenue(10_000, 2_500)).toBe(7_500);
    expect(computeOrderNetRevenue(10_000, 12_000)).toBe(0);
  });

  test('ratio révocation digitale < 1 conserve accès (seuil 99.9 %)', () => {
    const ratio = 3_000 / 10_000;
    expect(ratio).toBeLessThan(0.999);
    const shouldRevokeFully = ratio >= 0.999;
    expect(shouldRevokeFully).toBe(false);
  });
});

test.describe('Epic 2.3 — Staging apply_transaction_refund', () => {
  test.skip(!hasStagingSupabaseCredentials(), 'E2E_STAGING_SUPABASE_* non configuré');

  test('remboursement partiel puis total met à jour transactions et orders', async () => {
    const supabase = createStagingSupabaseClient();
    const fixture = await seedPartialRefundFixture(supabase);

    test.skip(!fixture, 'Impossible de créer la fixture de test');

    try {
      const partialAmount = Math.round(fixture!.amount * 0.3);
      const partial = await applyPartialRefundRpc(supabase, fixture!.transactionId, partialAmount);

      expect(partial.error).toBeUndefined();
      expect(partial.status).toBe('partially_refunded');
      expect(Number(partial.refunded_amount)).toBe(partialAmount);

      const { data: txAfterPartial } = await supabase
        .from('transactions')
        .select('status, refunded_amount')
        .eq('id', fixture!.transactionId)
        .single();

      expect(txAfterPartial?.status).toBe('partially_refunded');
      expect(Number(txAfterPartial?.refunded_amount)).toBe(partialAmount);

      const { data: orderAfterPartial } = await supabase
        .from('orders')
        .select('payment_status, refunded_amount')
        .eq('id', fixture!.orderId)
        .single();

      expect(orderAfterPartial?.payment_status).toBe('partially_refunded');

      const remaining = fixture!.amount - partialAmount;
      const full = await applyPartialRefundRpc(supabase, fixture!.transactionId, remaining);

      expect(full.error).toBeUndefined();
      expect(full.status).toBe('refunded');

      const { data: txFinal } = await supabase
        .from('transactions')
        .select('status, refunded_amount')
        .eq('id', fixture!.transactionId)
        .single();

      expect(txFinal?.status).toBe('refunded');
      expect(Number(txFinal?.refunded_amount)).toBe(fixture!.amount);
    } finally {
      if (fixture) {
        await cleanupPartialRefundFixture(supabase, fixture);
      }
    }
  });
});
