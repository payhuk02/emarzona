import { describe, expect, it } from 'vitest';
import {
  PAID_REVENUE_ELIGIBLE_STATUSES,
  isPaidBuyerAccessEligibleOrder,
  isPaidRevenueEligibleOrder,
  resolveOrderStatusAfterPayment,
} from '../order-status';

describe('order-status', () => {
  describe('resolveOrderStatusAfterPayment', () => {
    it('returns completed for digital-only orders', () => {
      expect(resolveOrderStatusAfterPayment(['digital'])).toBe('completed');
      expect(resolveOrderStatusAfterPayment(['course', 'artist'])).toBe('completed');
    });

    it('returns confirmed when any physical line exists', () => {
      expect(resolveOrderStatusAfterPayment(['digital', 'physical'])).toBe('confirmed');
      expect(resolveOrderStatusAfterPayment(['physical'])).toBe('confirmed');
    });

    it('defaults to completed when no line types', () => {
      expect(resolveOrderStatusAfterPayment([])).toBe('completed');
    });
  });

  describe('isPaidRevenueEligibleOrder', () => {
    it.each(PAID_REVENUE_ELIGIBLE_STATUSES)('accepts paid + %s for store earnings', status => {
      expect(isPaidRevenueEligibleOrder(status, 'paid')).toBe(true);
    });

    it('rejects unpaid or non-eligible status', () => {
      expect(isPaidRevenueEligibleOrder('confirmed', 'pending')).toBe(false);
      expect(isPaidRevenueEligibleOrder('pending', 'paid')).toBe(false);
      expect(isPaidRevenueEligibleOrder('confirmed', 'refunded')).toBe(false);
    });
  });

  describe('isPaidBuyerAccessEligibleOrder', () => {
    it('matches revenue eligibility for buyer access', () => {
      expect(isPaidBuyerAccessEligibleOrder('confirmed', 'paid')).toBe(true);
      expect(isPaidBuyerAccessEligibleOrder('completed', 'paid')).toBe(true);
      expect(isPaidBuyerAccessEligibleOrder('processing', 'paid')).toBe(false);
    });
  });
});
