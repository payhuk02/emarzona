import { describe, it, expect } from 'vitest';
import { validateMultiStorePaymentProvider } from '../multi-store-checkout';

describe('validateMultiStorePaymentProvider', () => {
  it('allows any provider for single store', () => {
    expect(
      validateMultiStorePaymentProvider({
        storeCount: 1,
        provider: 'stripe_connect',
        orchestrationEnabled: true,
      }).allowed
    ).toBe(true);
  });

  it('blocks Stripe on multi-store when orchestration enabled', () => {
    const result = validateMultiStorePaymentProvider({
      storeCount: 2,
      provider: 'stripe_connect',
      orchestrationEnabled: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.message).toMatch(/GeniusPay/i);
    }
  });

  it('allows GeniusPay multi-store', () => {
    expect(
      validateMultiStorePaymentProvider({
        storeCount: 3,
        provider: 'geniuspay',
        orchestrationEnabled: true,
      }).allowed
    ).toBe(true);
  });
});
