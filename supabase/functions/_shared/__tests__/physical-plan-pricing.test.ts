import { describe, expect, it } from 'vitest';
import {
  convertPlanAmountToCurrency,
  isAuthorizedPlanCheckoutAmount,
  resolveAuthorizedCheckoutAmount,
  roundAmountForCurrency,
} from '../physical-plan-pricing.ts';

describe('physical-plan-pricing (edge)', () => {
  it('validates exact USD subscription amount', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 25, 'USD')).toBe(true);
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 24, 'USD')).toBe(false);
  });

  it('validates converted XOF checkout for $25 plan (server fallback rate)', () => {
    const xofAmount = convertPlanAmountToCurrency(25, 'USD', 'XOF');
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', xofAmount, 'XOF')).toBe(true);
  });

  it('validates live-API XOF checkout (~14302) for $25 Starter plan', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 14302, 'XOF')).toBe(true);
    expect(resolveAuthorizedCheckoutAmount(25, 'USD', 14302, 'XOF')).toBe(14302);
  });

  it('validates live-API XOF checkout (~28032) for $49 Professional plan', () => {
    expect(isAuthorizedPlanCheckoutAmount(49, 'USD', 28032, 'XOF')).toBe(true);
  });

  it('rejects manipulated XOF checkout far below plan price', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 10000, 'XOF')).toBe(false);
  });

  it('rounds zero-decimal currencies', () => {
    expect(roundAmountForCurrency(14976.4, 'XOF')).toBe(14976);
    expect(roundAmountForCurrency(49.996, 'USD')).toBe(50);
  });
});
