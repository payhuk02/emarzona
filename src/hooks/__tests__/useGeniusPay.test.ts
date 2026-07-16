/**
 * Tests pour le hook useGeniusPay
 * Couvre les fonctionnalités de paiement GeniusPay
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGeniusPay } from '@/hooks/useGeniusPay';

// Mock geniuspayClient
vi.mock('@/lib/geniuspay-client', () => ({
  geniuspayClient: {
    createPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      checkout_url: 'https://geniuspay.com/checkout/test',
    }),
    createCheckout: vi.fn().mockResolvedValue({
      checkout_id: 'test-checkout-id',
      checkout_url: 'https://geniuspay.com/checkout/test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: 'completed',
      payment_id: 'test-payment-id',
    }),
    getPayment: vi.fn().mockResolvedValue({
      payment_id: 'test-payment-id',
      status: 'pending',
    }),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock safeRedirect
vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url, onError) => {
    // Simuler redirection réussie
    if (url && url.startsWith('https://')) {
      return;
    }
    onError?.();
  }),
}));

describe('useGeniusPay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useGeniusPay());

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.createPayment).toBe('function');
    expect(typeof result.current.createCheckout).toBe('function');
    expect(typeof result.current.verifyPayment).toBe('function');
    expect(typeof result.current.getPayment).toBe('function');
  });

  it('should create payment successfully', async () => {
    const { result } = renderHook(() => useGeniusPay());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    const promise = result.current.createPayment(paymentData);

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });

  it('should handle payment creation errors', async () => {
    const { geniuspayClient } = await import('@/lib/geniuspay-client');
    vi.mocked(geniuspayClient.createPayment).mockRejectedValueOnce(
      new Error('Payment failed')
    );

    const { result } = renderHook(() => useGeniusPay());

    const paymentData = {
      amount: 1000,
      currency: 'XOF',
      description: 'Test payment',
    };

    await expect(result.current.createPayment(paymentData)).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should create checkout successfully', async () => {
    const { result } = renderHook(() => useGeniusPay());

    const checkoutData = {
      items: [{ name: 'Product', price: 1000, quantity: 1 }],
      currency: 'XOF',
    };

    const promise = result.current.createCheckout(checkoutData);

    expect(result.current.loading).toBe(true);

    const checkout = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(checkout).toBeDefined();
    expect(checkout.checkout_id).toBe('test-checkout-id');
  });

  it('should verify payment successfully', async () => {
    const { result } = renderHook(() => useGeniusPay());

    const promise = result.current.verifyPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const verification = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(verification).toBeDefined();
    expect(verification.status).toBe('completed');
  });

  it('should get payment successfully', async () => {
    const { result } = renderHook(() => useGeniusPay());

    const promise = result.current.getPayment('test-payment-id');

    expect(result.current.loading).toBe(true);

    const payment = await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(payment).toBeDefined();
    expect(payment.payment_id).toBe('test-payment-id');
  });
});
