import { describe, expect, it } from 'vitest';
import {
  convertPlanAmountToCurrency,
  isAuthorizedPlanCheckoutAmount,
  roundAmountForCurrency,
} from '../physical-plan-pricing.ts';

describe('physical-plan-pricing (edge)', () => {
  it('validates exact USD subscription amount', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 25, 'USD')).toBe(true);
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 24, 'USD')).toBe(false);
  });

  it('validates converted XOF checkout for $25 plan', () => {
    const xofAmount = convertPlanAmountToCurrency(25, 'USD', 'XOF');
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', xofAmount, 'XOF')).toBe(true);
  });

  it('rounds zero-decimal currencies', () => {
    expect(roundAmountForCurrency(14976.4, 'XOF')).toBe(14976);
    expect(roundAmountForCurrency(49.996, 'USD')).toBe(50);
  });
});
