/**
 * E2E — Contrat statut commande post-paiement (P0)
 *
 * Vérifie que le module order-status (aligné SQL + webhooks) accepte
 * paid + (completed | confirmed) pour revenus et accès acheteur.
 *
 * Les flux Moneroo complets restent dans digital-product-workflow.spec.ts.
 */

import { test, expect } from '@playwright/test';
import {
  PAID_REVENUE_ELIGIBLE_STATUSES,
  isPaidRevenueEligibleOrder,
  resolveOrderStatusAfterPayment,
} from '../../src/lib/orders/order-status';

test.describe('Order status — paid fulfillment contract', () => {
  test('digital-only payment resolves to completed', () => {
    expect(resolveOrderStatusAfterPayment(['digital'])).toBe('completed');
    expect(resolveOrderStatusAfterPayment(['course'])).toBe('completed');
    expect(resolveOrderStatusAfterPayment(['artist', 'service'])).toBe('completed');
  });

  test('physical line resolves to confirmed for logistics pipeline', () => {
    expect(resolveOrderStatusAfterPayment(['physical'])).toBe('confirmed');
    expect(resolveOrderStatusAfterPayment(['digital', 'physical'])).toBe('confirmed');
  });

  test('paid + confirmed counts as revenue-eligible (Moneroo legacy path)', () => {
    expect(isPaidRevenueEligibleOrder('confirmed', 'paid')).toBe(true);
    expect(isPaidRevenueEligibleOrder('completed', 'paid')).toBe(true);
    expect(isPaidRevenueEligibleOrder('confirmed', 'pending')).toBe(false);
    expect(isPaidRevenueEligibleOrder('processing', 'paid')).toBe(false);
  });

  test('PAID_REVENUE_ELIGIBLE_STATUSES matches SQL is_order_paid_for_revenue', () => {
    expect(PAID_REVENUE_ELIGIBLE_STATUSES).toEqual(['completed', 'confirmed']);
  });
});
