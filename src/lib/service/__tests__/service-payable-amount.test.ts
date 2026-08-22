import { describe, expect, it } from 'vitest';
import {
  resolveServicePayableAmount,
  toPartialPaymentOrderFields,
} from '../service-payable-amount';

describe('resolveServicePayableAmount', () => {
  it('charges the full amount by default', () => {
    expect(resolveServicePayableAmount(10000, { payment_type: 'full' })).toMatchObject({
      amountToPay: 10000,
      remainingAmount: 0,
    });
  });

  it('charges the configured deposit percentage', () => {
    expect(
      resolveServicePayableAmount(10000, { payment_type: 'percentage', percentage_rate: 30 })
    ).toEqual({
      paymentType: 'percentage',
      percentageRate: 30,
      amountToPay: 3000,
      remainingAmount: 7000,
      totalAmount: 10000,
    });
  });

  it('uses service deposit percentage when payment_options is full', () => {
    expect(
      resolveServicePayableAmount(
        10000,
        { payment_type: 'full' },
        { deposit_required: true, deposit_type: 'percentage', deposit_amount: 40 }
      )
    ).toMatchObject({
      paymentType: 'percentage',
      percentageRate: 40,
      amountToPay: 4000,
      remainingAmount: 6000,
    });
  });

  it('clamps percentage between 10 and 90', () => {
    expect(
      resolveServicePayableAmount(1000, { payment_type: 'percentage', percentage_rate: 5 })
        .percentageRate
    ).toBe(10);
    expect(
      resolveServicePayableAmount(1000, { payment_type: 'percentage', percentage_rate: 99 })
        .percentageRate
    ).toBe(90);
  });
});

describe('toPartialPaymentOrderFields', () => {
  it('stores the amount due now, not the percentage rate', () => {
    const payable = resolveServicePayableAmount(10000, {
      payment_type: 'percentage',
      percentage_rate: 30,
    });
    expect(toPartialPaymentOrderFields(payable)).toEqual({
      payment_type: 'percentage',
      percentage_paid: 3000,
      remaining_amount: 7000,
    });
  });

  it('returns null for a full payment', () => {
    expect(
      toPartialPaymentOrderFields(resolveServicePayableAmount(10000, { payment_type: 'full' }))
    ).toBeNull();
  });

  it('stores a fixed deposit as the payable amount', () => {
    const payable = resolveServicePayableAmount(
      10000,
      { payment_type: 'full' },
      { deposit_required: true, deposit_type: 'fixed', deposit_amount: 2500 }
    );
    expect(toPartialPaymentOrderFields(payable)).toEqual({
      payment_type: 'percentage',
      percentage_paid: 2500,
      remaining_amount: 7500,
    });
  });
});
