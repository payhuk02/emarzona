/**
 * Smoke + contrats buy-now pour useCreateServiceOrder
 * (le parcours cart mixte est retiré — checkoutMode:cart lève une erreur).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateServiceOrder } from '@/hooks/orders/useCreateServiceOrder';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/payment-service', () => ({
  initiatePayment: vi.fn(),
}));

vi.mock('@/lib/affiliate-cookie', () => ({
  getAffiliateTrackingCookie: vi.fn(() => null),
}));

describe('useCreateServiceOrder', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('expose mutate / mutateAsync', () => {
    const { result } = renderHook(() => useCreateServiceOrder(), { wrapper });
    expect(result.current.mutate).toBeTypeOf('function');
    expect(result.current.mutateAsync).toBeTypeOf('function');
  });

  it('refuse checkoutMode cart (buy-now only)', async () => {
    const { result } = renderHook(() => useCreateServiceOrder(), { wrapper });

    await expect(
      result.current.mutateAsync({
        serviceProductId: 'svc-1',
        productId: 'prod-1',
        storeId: 'store-1',
        customerEmail: 'a@b.c',
        bookingDateTime: new Date(Date.now() + 86400000).toISOString(),
        checkoutMode: 'cart',
      } as never)
    ).rejects.toThrow(/fiche produit|panier/i);
  });
});
