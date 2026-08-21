import { describe, expect, it } from 'vitest';
import { resolveServicePayableAmount } from '../service-payable-amount';

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
