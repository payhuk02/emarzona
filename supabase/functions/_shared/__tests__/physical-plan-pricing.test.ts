import { describe, expect, it } from 'vitest';
import {
  applyCheckoutPlatformFee,
  estimatePlanAmountFromCheckoutTtc,
  getCheckoutPlatformFee,
} from '../checkout-platform-fee.ts';
import {
  convertPlanAmountToCurrency,
  isAuthorizedPlanCheckoutAmount,
  isAuthorizedPlanCheckoutAmountWithFee,
  resolveAuthorizedCheckoutAmount,
  resolveAuthorizedCheckoutAmountWithFee,
  roundAmountForCurrency,
} from '../physical-plan-pricing.ts';

describe('physical-plan-pricing (edge)', () => {
  it('validates exact USD subscription amount without fee helper', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 25, 'USD')).toBe(true);
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 24, 'USD')).toBe(false);
  });

  it('validates USD subscription TTC with checkout fee', () => {
    const ttc = applyCheckoutPlatformFee(25, 'USD');
    expect(isAuthorizedPlanCheckoutAmountWithFee(25, 'USD', ttc, 'USD')).toBe(true);
    expect(isAuthorizedPlanCheckoutAmountWithFee(25, 'USD', 25, 'USD')).toBe(false);
    expect(resolveAuthorizedCheckoutAmountWithFee(25, 'USD', ttc, 'USD')).toBe(ttc);
  });

  it('validates converted XOF checkout for $25 plan (server fallback rate)', () => {
    const xofAmount = convertPlanAmountToCurrency(25, 'USD', 'XOF');
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', xofAmount, 'XOF')).toBe(true);
  });

  it('validates live-API XOF checkout (~14302) for $25 Starter plan', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 14302, 'XOF')).toBe(true);
    expect(resolveAuthorizedCheckoutAmount(25, 'USD', 14302, 'XOF')).toBe(14302);
  });

  it('validates XOF TTC (plan + 2%+100) for $25 plan', () => {
    const planXof = 14302;
    const ttc = applyCheckoutPlatformFee(planXof, 'XOF');
    expect(ttc).toBe(planXof + getCheckoutPlatformFee(planXof, 'XOF'));
    expect(isAuthorizedPlanCheckoutAmountWithFee(25, 'USD', ttc, 'XOF')).toBe(true);
    expect(resolveAuthorizedCheckoutAmountWithFee(25, 'USD', ttc, 'XOF')).toBe(ttc);
  });

  it('validates live-API XOF checkout (~28032) for $49 Professional plan', () => {
    expect(isAuthorizedPlanCheckoutAmount(49, 'USD', 28032, 'XOF')).toBe(true);
  });

  it('rejects manipulated XOF checkout far below plan price', () => {
    expect(isAuthorizedPlanCheckoutAmount(25, 'USD', 10000, 'XOF')).toBe(false);
    expect(
      isAuthorizedPlanCheckoutAmountWithFee(
        25,
        'USD',
        applyCheckoutPlatformFee(10000, 'XOF'),
        'XOF'
      )
    ).toBe(false);
  });

  it('reverses TTC to plan amount for fee stripping', () => {
    const plan = 14976;
    const ttc = applyCheckoutPlatformFee(plan, 'XOF');
    expect(estimatePlanAmountFromCheckoutTtc(ttc, 'XOF')).toBe(plan);
  });

  it('rounds zero-decimal currencies', () => {
    expect(roundAmountForCurrency(14976.4, 'XOF')).toBe(14976);
    expect(roundAmountForCurrency(49.996, 'USD')).toBe(50);
  });
});
