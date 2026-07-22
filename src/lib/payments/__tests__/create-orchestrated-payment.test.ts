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

vi.mock('../adapters/moneyfusion-adapter', () => ({
  createMoneyFusionPayment: vi.fn(),
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
import { createMoneyFusionPayment } from '../adapters/moneyfusion-adapter';
import { createStripeConnectPayment } from '../adapters/stripe-connect-adapter';
import { createPayPalCommercePayment } from '../adapters/paypal-commerce-adapter';

const baseConnection = (overrides: Partial<StorePaymentConnection>): StorePaymentConnection => ({
  id: 'conn-1',
  store_id: 'store-1',
  provider: 'moneyfusion',
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
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
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
    expect(createMoneyFusionPayment).not.toHaveBeenCalled();
    expect(result.provider).toBe('stripe_connect');
    expect(result.checkout_url).toContain('stripe.com');
  });

  it('migre preferredProvider geniuspay_platform vers MoneyFusion', async () => {
    const connections = [
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        capabilities: { card_payments: true },
      }),
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createMoneyFusionPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-m',
      checkout_url: 'https://payin.moneyfusion.net/x',
      provider: 'moneyfusion',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-2',
      amount: 10000,
      currency: 'XOF',
      description: 'XOF order',
      customerEmail: 'buyer@example.com',
      customerPhone: '75591378',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      preferredProvider: 'geniuspay_platform',
      connections,
    });

    expect(createMoneyFusionPayment).toHaveBeenCalledOnce();
    expect(createStripeConnectPayment).not.toHaveBeenCalled();
    expect(result.provider).toBe('moneyfusion');
  });

  it('honore preferredProvider via resolve (PayPal si compatible)', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
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

  it('fallback MoneyFusion sur erreur Stripe explicite', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
      baseConnection({
        id: 'c-s',
        provider: 'stripe_connect',
        external_account_id: 'acct_1',
        capabilities: { card_payments: true },
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createStripeConnectPayment).mockRejectedValue(new Error('Stripe API unavailable'));
    vi.mocked(createMoneyFusionPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-fallback',
      checkout_url: 'https://payin.moneyfusion.net/fallback',
      provider: 'moneyfusion',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-stripe-error',
      amount: 60,
      currency: 'EUR',
      description: 'Stripe error',
      customerEmail: 'buyer@example.com',
      customerPhone: '75591378',
    });

    expect(createMoneyFusionPayment).toHaveBeenCalled();
    expect(result.provider).toBe('moneyfusion');
    expect(result.psp_fallback?.from_provider).toBe('stripe_connect');
    expect(result.psp_fallback?.to_provider).toBe('moneyfusion');
    expect(result.psp_fallback?.reason).toBe('provider_error');
  });

  it('fallback MoneyFusion sur erreur générique quand provider résolu non MoneyFusion', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
      baseConnection({
        id: 'c-p',
        provider: 'paypal_commerce',
        external_account_id: 'merchant_1',
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createPayPalCommercePayment).mockRejectedValue(new Error('PayPal timeout'));
    vi.mocked(createMoneyFusionPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-generic-fallback',
      checkout_url: 'https://payin.moneyfusion.net/fallback-2',
      provider: 'moneyfusion',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-generic-error',
      amount: 70,
      currency: 'USD',
      description: 'Generic error',
      customerEmail: 'buyer@example.com',
      customerPhone: '75591378',
      preferredProvider: 'paypal_commerce',
      connections,
    });

    expect(createMoneyFusionPayment).toHaveBeenCalled();
    expect(result.psp_fallback?.from_provider).toBe('paypal_commerce');
    expect(result.psp_fallback?.reason).toBe('provider_error');
  });

  it('retourne un échec standard si fallback MoneyFusion échoue aussi', async () => {
    const connections = [
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
      baseConnection({
        id: 'c-p',
        provider: 'paypal_commerce',
        external_account_id: 'merchant_1',
      }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createPayPalCommercePayment).mockRejectedValue(new Error('PayPal down'));
    vi.mocked(createMoneyFusionPayment).mockRejectedValue(new Error('MoneyFusion down'));

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
    expect(result.provider).toBe('moneyfusion');
    expect(result.error).toContain('PayPal down');
  });

  it('fallback MoneyFusion explicite si provider non prêt (Flutterwave)', async () => {
    const connections = [
      baseConnection({
        id: 'c-f',
        provider: 'flutterwave_connect',
        external_account_id: 'flw_1',
      }),
      baseConnection({ id: 'c-m', provider: 'moneyfusion' }),
    ];
    vi.mocked(loadStorePaymentConnections).mockResolvedValue(connections);
    vi.mocked(createMoneyFusionPayment).mockResolvedValue({
      success: true,
      transaction_id: 'tx-fallback',
      checkout_url: 'https://payin.moneyfusion.net/fallback',
      provider: 'moneyfusion',
    });

    const result = await createOrchestratedPayment({
      storeId: 'store-1',
      orderId: 'order-fb',
      amount: 5000,
      currency: 'NGN',
      description: 'Fallback test',
      customerEmail: 'buyer@example.com',
      customerPhone: '75591378',
      preferredProvider: 'flutterwave_connect',
      connections,
    });

    expect(createMoneyFusionPayment).toHaveBeenCalled();
    expect(result.provider).toBe('moneyfusion');
    expect(result.psp_fallback?.from_provider).toBe('flutterwave_connect');
    expect(result.psp_fallback?.reason).toBe('provider_not_ready');
  });
});
