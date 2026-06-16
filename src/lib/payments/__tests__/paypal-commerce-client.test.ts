import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPayPalCommerceCheckout,
  startPayPalPartnerOnboarding,
} from '@/lib/payments/paypal-commerce-client';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('paypal-commerce-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invoke error for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'invoke failed' } });

    const result = await startPayPalPartnerOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
    });

    expect(result.error).toBe('invoke failed');
  });

  it('returns data error for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'merchant blocked' }, error: null });

    const result = await startPayPalPartnerOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
    });

    expect(result).toEqual({ error: 'merchant blocked' });
  });

  it('returns empty response fallback for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: null, error: null });

    const result = await startPayPalPartnerOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
    });

    expect(result).toEqual({ error: 'Empty response' });
  });

  it('returns success checkout data', async () => {
    invokeMock.mockResolvedValue({
      data: {
        success: true,
        transaction_id: 'tx-1',
        checkout_url: 'https://paypal/checkout',
        provider_session_id: 'pp_1',
      },
      error: null,
    });

    const result = await createPayPalCommerceCheckout({
      storeId: 'store-1',
      orderId: 'order-1',
      amount: 100,
      currency: 'EUR',
      description: 'Order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
      metadata: { checkout_token: 'tok-paypal' },
    });

    expect(invokeMock).toHaveBeenCalledWith(
      'paypal-create-order',
      expect.objectContaining({ body: expect.objectContaining({ checkoutToken: 'tok-paypal' }) })
    );
    expect(result.success).toBe(true);
  });

  it('returns fallback message when checkout payload invalid', async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, transaction_id: 'tx-2', error: 'declined' },
      error: null,
    });

    const result = await createPayPalCommerceCheckout({
      storeId: 'store-1',
      orderId: 'order-2',
      amount: 100,
      currency: 'EUR',
      description: 'Order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    });

    expect(result.success).toBe(false);
    expect(result.checkout_url).toBe('');
    expect(result.error).toBe('declined');
  });

  it('returns invoke error fallback for checkout', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'paypal edge down' } });

    const result = await createPayPalCommerceCheckout({
      storeId: 'store-1',
      orderId: 'order-3',
      amount: 100,
      currency: 'EUR',
      description: 'Order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('paypal edge down');
    expect(result.transaction_id).toBe('');
  });

  it('returns default checkout failure message when error is missing', async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, transaction_id: '' },
      error: null,
    });

    const result = await createPayPalCommerceCheckout({
      storeId: 'store-1',
      orderId: 'order-4',
      amount: 100,
      currency: 'EUR',
      description: 'Order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('PayPal checkout failed');
  });
});
