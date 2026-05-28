import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrchestratedPayment } from '../orchestrator/create-payment';
import type { StorePaymentConnection } from '@/types/store-payment-connection';

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../orchestrator/load-connections', () => ({
  loadStorePaymentConnections: vi.fn(),
  loadStoreForcePlatformPayments: vi.fn(),
}));

vi.mock('../adapters/moneroo-adapter', () => ({
  createMonerooPlatformPayment: vi.fn(),
}));

vi.mock('../adapters/stripe-connect-adapter', () => ({
  createStripeConnectPayment: vi.fn(),
}));

vi.mock('../adapters/paypal-commerce-adapter', () => ({
  createPayPalCommercePayment: vi.fn(),
}));

import {
  loadStorePaymentConnections,
  loadStoreForcePlatformPayments,
} from '../orchestrator/load-connections';
import { createMonerooPlatformPayment } from '../adapters/moneroo-adapter';
import { createStripeConnectPayment } from '../adapters/stripe-connect-adapter';

const baseConnection = (overrides: Partial<StorePaymentConnection>): StorePaymentConnection => ({
  id: 'conn-1',
  store_id: 'store-1',
  provider: 'moneroo_platform',
  connection_mode: 'platform_default',
  external_account_id: null,
  external_account_status: 'active',
  capabilities: {},
  default_currency: 'XOF',
  livemode: false,
  ...overrides,
});

describe('createOrchestratedPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadStoreForcePlatformPayments).mockResolvedValue(false);
  });

  it('délègue à Stripe Connect quand EUR et connexion active', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        external_account_id: 'acct_1',
        capabilities: { card_payments: true },
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createStripeConnectPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://checkout.stripe.com/pay',
      provider: 'stripe_connect',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-1',
      amount: 50,
      currency: 'EUR',
      description: 'Test order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(createStripeConnectPayment).toHaveBeenCalledOnce();
    expect(createMonerooPlatformPayment).not.toHaveBeenCalled();
    expect(result.provider).toBe('stripe_connect');
    expect(result.checkout_url).toContain('stripe.com');
  });

  it('respecte preferredProvider moneroo_platform', async () => {
    const connections = [
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        capabilities: { card_payments: true },
      }),
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createMonerooPlatformPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-m',
      checkout_url: 'https://pay.moneroo.io/x',
      provider: 'moneroo_platform',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-2',
      amount: 10000,
      currency: 'XOF',
      description: 'XOF order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      preferredProvider: 'moneroo_platform',
      connections,
    });

    expect(createMonerooPlatformPayment).toHaveBeenCalledOnce();
    expect(createStripeConnectPayment).not.toHaveBeenCalled();
    expect(result.provider).toBe('moneroo_platform');
  });
});
