import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStripeConnectPayment } from '@/lib/payments/adapters/stripe-connect-adapter';

const createStripeConnectCheckout = vi.fn();

vi.mock('@/lib/payments/stripe-connect-client', () => ({
  createStripeConnectCheckout: (...args: unknown[]) => createStripeConnectCheckout(...args),
}));

describe('createStripeConnectPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns validation error when orderId is missing', async () => {
    const result = await createStripeConnectPayment({
      storeId: 'store-1',
      amount: 100,
      description: 'Order',
      customerEmail: 'buyer@example.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('orderId is required');
  });

  it('returns validation error when customerEmail is missing', async () => {
    const result = await createStripeConnectPayment({
      storeId: 'store-1',
      amount: 100,
      description: 'Order',
      orderId: 'order-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('customerEmail is required');
  });

  it('calls client and maps checkout result', async () => {
    createStripeConnectCheckout.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://stripe/checkout',
      provider_session_id: 'cs_1',
    });

    const result = await createStripeConnectPayment({
      storeId: 'store-1',
      orderId: 'order-1',
      amount: 100,
      description: 'Order',
      customerEmail: 'buyer@example.com',
      metadata: { checkout_token: 'tok-2' },
      connections: [{ id: 'c-s', provider: 'stripe_connect' } as never],
    });

    expect(createStripeConnectCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutToken: 'tok-2',
        currency: 'EUR',
        successUrl: expect.stringContaining('/payment/success'),
        cancelUrl: expect.stringContaining('/payment/cancel'),
      })
    );
    expect(result.provider_transaction_id).toBe('cs_1');
    expect(result.connection_id).toBe('c-s');
  });
});
