import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createStripeConnectCheckout,
  startStripeConnectOnboarding,
} from '@/lib/payments/stripe-connect-client';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('stripe-connect-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invoke error for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'invoke failed' } });

    const result = await startStripeConnectOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
      refreshUrl: 'https://app/refresh',
    });

    expect(result.error).toBe('invoke failed');
  });

  it('returns data error for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'account restricted' }, error: null });

    const result = await startStripeConnectOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
      refreshUrl: 'https://app/refresh',
    });

    expect(result).toEqual({ error: 'account restricted' });
  });

  it('returns empty response fallback for onboarding', async () => {
    invokeMock.mockResolvedValue({ data: null, error: null });

    const result = await startStripeConnectOnboarding({
      storeId: 'store-1',
      returnUrl: 'https://app/return',
      refreshUrl: 'https://app/refresh',
    });

    expect(result).toEqual({ error: 'Empty response' });
  });

  it('returns success checkout data', async () => {
    invokeMock.mockResolvedValue({
      data: {
        success: true,
        transaction_id: 'tx-1',
        checkout_url: 'https://stripe/checkout',
        provider_session_id: 'cs_1',
      },
      error: null,
    });

    const result = await createStripeConnectCheckout({
      storeId: 'store-1',
      orderId: 'order-1',
      amount: 100,
      currency: 'EUR',
      description: 'Order',
      customerEmail: 'buyer@example.com',
      successUrl: 'https://app/success',
      cancelUrl: 'https://app/cancel',
      metadata: { checkout_token: 'tok-stripe' },
    });

    expect(invokeMock).toHaveBeenCalledWith(
      'stripe-create-checkout',
      expect.objectContaining({ body: expect.objectContaining({ checkoutToken: 'tok-stripe' }) })
    );
    expect(result.success).toBe(true);
  });

  it('returns fallback message when checkout payload invalid', async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, transaction_id: 'tx-2', error: 'declined' },
      error: null,
    });

    const result = await createStripeConnectCheckout({
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
    invokeMock.mockResolvedValue({ data: null, error: { message: 'stripe edge down' } });

    const result = await createStripeConnectCheckout({
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
    expect(result.error).toBe('stripe edge down');
    expect(result.transaction_id).toBe('');
  });

  it('returns default checkout failure message when error is missing', async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, transaction_id: '' },
      error: null,
    });

    const result = await createStripeConnectCheckout({
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
    expect(result.error).toBe('Stripe checkout failed');
  });
});
