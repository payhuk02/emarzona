import { describe, it, expect } from 'vitest';
import { getPaymentProviderLabel } from '@/lib/payments/payment-provider-labels';

describe('getPaymentProviderLabel', () => {
  it('maps known provider codes', () => {
    expect(getPaymentProviderLabel('stripe_connect')).toBe('Stripe');
    expect(getPaymentProviderLabel('paypal_commerce')).toBe('PayPal');
    expect(getPaymentProviderLabel('flutterwave_connect')).toBe('Flutterwave');
    expect(getPaymentProviderLabel('geniuspay_platform')).toBe('MoneyFusion');
    expect(getPaymentProviderLabel('geniuspay')).toBe('MoneyFusion');
    expect(getPaymentProviderLabel('moneyfusion')).toBe('MoneyFusion');
  });

  it('returns Inconnu when provider is missing', () => {
    expect(getPaymentProviderLabel(null)).toBe('Inconnu');
    expect(getPaymentProviderLabel(undefined)).toBe('Inconnu');
  });

  it('falls back to raw provider string for unknown values', () => {
    expect(getPaymentProviderLabel('some_new_provider')).toBe('some_new_provider');
  });
});
