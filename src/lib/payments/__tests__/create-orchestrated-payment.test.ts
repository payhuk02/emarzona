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
import { createPayPalCommercePayment } from '../adapters/paypal-commerce-adapter';

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

  it('honore preferredProvider via resolve (PayPal si compatible)', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
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
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);

    vi.mocked(createPayPalCommercePayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-p',
      checkout_url: 'https://paypal.com/checkout',
      provider: 'paypal_commerce',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-3',
      amount: 50,
      currency: 'USD',
      description: 'USD order',
      customerEmail: 'buyer@example.com',
      preferredProvider: 'paypal_commerce',
      connections,
    });

    expect(createPayPalCommercePayment).toHaveBeenCalledOnce();
    expect(createStripeConnectPayment).not.toHaveBeenCalled();
    expect(result.provider).toBe('paypal_commerce');
  });

  it('ajoute psp_fallback adapter_redirect quand un adapter retourne Moneroo', async () => {
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
      transaction_id: 'tx-redirect',
      checkout_url: 'https://pay.moneroo.io/fallback',
      provider: 'moneroo_platform',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-redirect',
      amount: 40,
      currency: 'EUR',
      description: 'Adapter redirect',
      customerEmail: 'buyer@example.com',
    });

    expect(result.provider).toBe('moneroo_platform');
    expect(result.psp_fallback?.from_provider).toBe('stripe_connect');
    expect(result.psp_fallback?.reason).toBe('adapter_redirect');
  });

  it('fallback Moneroo sur erreur Stripe explicite', async () => {
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
    vi.mocked(createStripeConnectPayment).mockRejectedValue(new Error('Stripe API unavailable'));
    vi.mocked(createMonerooPlatformPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-fallback',
      checkout_url: 'https://pay.moneroo.io/fallback',
      provider: 'moneroo_platform',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-stripe-error',
      amount: 60,
      currency: 'EUR',
      description: 'Stripe error',
      customerEmail: 'buyer@example.com',
    });

    expect(createMonerooPlatformPayment).toHaveBeenCalled();
    expect(result.provider).toBe('moneroo_platform');
    expect(result.psp_fallback?.from_provider).toBe('stripe_connect');
    expect(result.psp_fallback?.reason).toBe('provider_error');
  });

  it('fallback Moneroo sur erreur générique quand provider résolu non Moneroo', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
      baseConnection({
        id: 'c-p',
        provider: 'paypal_commerce',
        external_account_id: 'merchant_1',
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createPayPalCommercePayment).mockRejectedValue(new Error('PayPal timeout'));
    vi.mocked(createMonerooPlatformPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-generic-fallback',
      checkout_url: 'https://pay.moneroo.io/fallback-2',
      provider: 'moneroo_platform',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-generic-error',
      amount: 70,
      currency: 'USD',
      description: 'Generic error',
      customerEmail: 'buyer@example.com',
      preferredProvider: 'paypal_commerce',
      connections,
    });

    expect(createMonerooPlatformPayment).toHaveBeenCalled();
    expect(result.psp_fallback?.from_provider).toBe('paypal_commerce');
    expect(result.psp_fallback?.reason).toBe('provider_error');
  });

  it('retourne un échec standard si fallback Moneroo échoue aussi', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
      baseConnection({
        id: 'c-p',
        provider: 'paypal_commerce',
        external_account_id: 'merchant_1',
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createPayPalCommercePayment).mockRejectedValue(new Error('PayPal down'));
    vi.mocked(createMonerooPlatformPayment).mockRejectedValue(new Error('Moneroo down'));

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-double-fail',
      amount: 80,
      currency: 'USD',
      description: 'Double fail',
      customerEmail: 'buyer@example.com',
      preferredProvider: 'paypal_commerce',
      connections,
    });

    expect(result.success).toBe(false);
    expect(result.provider).toBe('moneroo_platform');
    expect(result.error).toContain('PayPal down');
  });

  it('fallback Moneroo explicite si provider non prêt (Flutterwave)', async () => {
    const connections = [
      baseConnection({
        id: 'c-f',
        provider: 'flutterwave_connect',
        external_account_id: 'flw_1',
      }),
      baseConnection({ id: 'c-m', provider: 'moneroo_platform' }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createMonerooPlatformPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-fallback',
      checkout_url: 'https://pay.moneroo.io/fallback',
      provider: 'moneroo_platform',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-fb',
      amount: 5000,
      currency: 'NGN',
      description: 'Fallback test',
      customerEmail: 'buyer@example.com',
      preferredProvider: 'flutterwave_connect',
      connections,
    });

    expect(createMonerooPlatformPayment).toHaveBeenCalled();
    expect(result.provider).toBe('moneroo_platform');
    expect(result.psp_fallback?.from_provider).toBe('flutterwave_connect');
    expect(result.psp_fallback?.reason).toBe('provider_not_ready');
  });
});
