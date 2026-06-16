import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPayPalCommercePayment } from '@/lib/payments/adapters/paypal-commerce-adapter';

const createPayPalCommerceCheckout = vi.fn();

vi.mock('@/lib/payments/paypal-commerce-client', () => ({
  createPayPalCommerceCheckout: (...args: unknown[]) => createPayPalCommerceCheckout(...args),
}));

describe('createPayPalCommercePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns validation error when orderId is missing', async () => {
    const result = await createPayPalCommercePayment({
      storeId: 'store-1',
      amount: 100,
      description: 'Order',
      customerEmail: 'buyer@example.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('orderId is required');
  });

  it('returns validation error when customerEmail is missing', async () => {
    const result = await createPayPalCommercePayment({
      storeId: 'store-1',
      amount: 100,
      description: 'Order',
      orderId: 'order-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('customerEmail is required');
  });

  it('calls client and maps checkout result', async () => {
    createPayPalCommerceCheckout.mockResolvedValue({
      success: true,
      transaction_id: 'tx-1',
      checkout_url: 'https://paypal/checkout',
      provider_session_id: 'pp-session',
    });

    const result = await createPayPalCommercePayment({
      storeId: 'store-1',
      orderId: 'order-1',
      amount: 100,
      description: 'Order',
      customerEmail: 'buyer@example.com',
      metadata: { checkout_token: 'tok-1' },
      connections: [{ id: 'c-p', provider: 'paypal_commerce' } as never],
    });

    expect(createPayPalCommerceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutToken: 'tok-1',
        currency: 'EUR',
        successUrl: expect.stringContaining('/payment/success'),
        cancelUrl: expect.stringContaining('/payment/cancel'),
      })
    );
    expect(result.provider_transaction_id).toBe('pp-session');
    expect(result.connection_id).toBe('c-p');
  });
});
