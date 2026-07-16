import { describe, it, expect } from 'vitest';
import { resolvePaymentProvider } from '../orchestrator/resolve-provider';
import type { StorePaymentConnection } from '@/types/store-payment-connection';

const baseConnection = (overrides: Partial<StorePaymentConnection>): StorePaymentConnection => ({
  id: 'conn-1',
  store_id: 'store-1',
  provider: 'geniuspay_platform',
  connection_mode: 'platform_default',
  external_account_id: null,
  external_account_status: 'active',
  capabilities: {},
  default_currency: 'XOF',
  livemode: false,
  ...overrides,
});

describe('resolvePaymentProvider', () => {
  it('choisit stripe_connect pour EUR si connecté', () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'geniuspay_platform' }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        external_account_id: 'acct_123',
        capabilities: { card_payments: true },
      }),
    ];

    const result = resolvePaymentProvider({
      storeId: 'store-1',
      amount: 10000,
      currency: 'EUR',
      connections,
    });

    expect(result.provider).toBe('stripe_connect');
    expect(result.connectionId).toBe('c-s');
  });

  it('force geniuspay_platform si forcePlatformPayments', () => {
    const connections = [
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        capabilities: { card_payments: true },
      }),
    ];

    const result = resolvePaymentProvider({
      storeId: 'store-1',
      amount: 10000,
      currency: 'EUR',
      connections,
      forcePlatformPayments: true,
    });

    expect(result.provider).toBe('geniuspay_platform');
    expect(result.reason).toBe('store_force_platform_payments');
  });

  it('retombe sur geniuspay si stripe inactif', () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'geniuspay_platform' }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        external_account_status: 'pending',
      }),
    ];

    const result = resolvePaymentProvider({
      storeId: 'store-1',
      amount: 5000,
      currency: 'USD',
      connections,
    });

    expect(result.provider).toBe('geniuspay_platform');
  });

  it('route XOF vers geniuspay même si Stripe connecté (pas de carte XOF)', () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'geniuspay_platform' }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        external_account_id: 'acct_123',
        capabilities: { card_payments: true },
      }),
    ];

    const result = resolvePaymentProvider({
      storeId: 'store-1',
      amount: 15_000,
      currency: 'XOF',
      connections,
    });

    expect(result.provider).toBe('geniuspay_platform');
  });

  it('respecte la préférence acheteur si compatible', () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'geniuspay_platform' }),
      baseConnection({
        id: 'c-p',
        provider: 'paypal_commerce',
        external_account_id: 'merchant_1',
      }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        capabilities: { card_payments: true },
      }),
    ];

    const result = resolvePaymentProvider({
      storeId: 'store-1',
      amount: 50,
      currency: 'USD',
      connections,
      buyerPreferredProvider: 'paypal_commerce',
    });

    expect(result.provider).toBe('paypal_commerce');
    expect(result.connectionId).toBe('c-p');
  });
});
