import { describe, expect, it } from 'vitest';
import {
  isMoneyFusionProvider,
  isPlatformCheckoutProvider,
  resolveExternalPaymentId,
} from '@/lib/payments/platform-payment-providers';

describe('platform-payment-providers', () => {
  it('recognizes moneyfusion and geniuspay', () => {
    expect(isPlatformCheckoutProvider('moneyfusion')).toBe(true);
    expect(isPlatformCheckoutProvider('geniuspay')).toBe(true);
    expect(isPlatformCheckoutProvider('stripe')).toBe(false);
    expect(isMoneyFusionProvider('moneyfusion')).toBe(true);
  });

  it('resolves MF payment_id preferentially', () => {
    expect(
      resolveExternalPaymentId({
        payment_provider: 'moneyfusion',
        payment_id: 'mf-token',
        geniuspay_transaction_id: 'legacy',
      })
    ).toBe('mf-token');
    expect(
      resolveExternalPaymentId({
        payment_provider: 'geniuspay',
        payment_id: 'other',
        geniuspay_transaction_id: 'gp-id',
      })
    ).toBe('gp-id');
  });
});
