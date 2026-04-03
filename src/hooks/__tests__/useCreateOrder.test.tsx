/**
 * Tests pour useCreateOrder
 * Hook universel pour créer une commande
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCreateOrder } from '../orders/useCreateOrder';

// ============================================================
// MOCKS
// ============================================================

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/hooks/orders/useCreateDigitalOrder', () => ({
  useCreateDigitalOrder: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      orderId: 'digital-order-1',
      checkoutUrl: 'https://checkout.example.com/digital',
    }),
  })),
}));

vi.mock('@/hooks/orders/useCreatePhysicalOrder', () => ({
  useCreatePhysicalOrder: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      orderId: 'physical-order-1',
      checkoutUrl: 'https://checkout.example.com/physical',
    }),
  })),
}));

vi.mock('@/hooks/orders/useCreateServiceOrder', () => ({
  useCreateServiceOrder: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      orderId: 'service-order-1',
      checkoutUrl: 'https://checkout.example.com/service',
    }),
  })),
}));

vi.mock('@/hooks/orders/useCreateCourseOrder', () => ({
  useCreateCourseOrder: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      orderId: 'course-order-1',
      checkoutUrl: 'https://checkout.example.com/course',
    }),
  })),
}));

vi.mock('@/hooks/orders/useCreateArtistOrder', () => ({
  useCreateArtistOrder: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      orderId: 'artist-order-1',
      checkoutUrl: 'https://checkout.example.com/artist',
    }),
  })),
}));

vi.mock('@/lib/moneroo-payment', () => ({
  initiateMonerooPayment: vi.fn().mockResolvedValue({
    success: true,
    checkout_url: 'https://checkout.example.com/generic',
    transaction_id: 'tx-123',
  }),
}));

vi.mock('@/hooks/useAffiliateTracking', () => ({
  getAffiliateTrackingCookie: vi.fn(() => null),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ============================================================
// SETUP
// ============================================================

describe('useCreateOrder', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  // ============================================================
  // TESTS DE BASE
  // ============================================================

  it('should return mutation function', () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  // ============================================================
  // TESTS PAR TYPE DE PRODUIT
  // ============================================================

  it('should create digital order successfully', async () => {
    const mockProduct = {
      id: 'product-1',
      product_type: 'digital',
      name: 'Digital Product',
      price: 29.99,
      currency: 'EUR',
    };

    const mockDigitalProduct = { id: 'digital-product-1' };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDigitalProduct, error: null }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    const orderResult = await result.current.mutateAsync({
      productId: 'product-1',
      storeId: 'store-1',
      customerEmail: 'test@example.com',
      digitalOptions: {},
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.orderId).toBe('digital-order-1');
    expect(orderResult.checkoutUrl).toContain('checkout');
  });

  it('should create physical order successfully', async () => {
    const mockProduct = {
      id: 'product-2',
      product_type: 'physical',
      name: 'Physical Product',
      price: 49.99,
      currency: 'EUR',
    };

    const mockPhysicalProduct = { id: 'physical-product-1' };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPhysicalProduct, error: null }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    const orderResult = await result.current.mutateAsync({
      productId: 'product-2',
      storeId: 'store-1',
      customerEmail: 'test@example.com',
      physicalOptions: {
        shippingAddress: {
          street: '123 Main St',
          city: 'Paris',
          zipCode: '75001',
          country: 'FR',
        },
      },
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.orderId).toBe('physical-order-1');
  });

  it('should create service order successfully', async () => {
    const mockProduct = {
      id: 'product-3',
      product_type: 'service',
      name: 'Service Product',
      price: 99.99,
      currency: 'EUR',
    };

    const mockServiceProduct = { id: 'service-product-1' };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockServiceProduct, error: null }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    const orderResult = await result.current.mutateAsync({
      productId: 'product-3',
      storeId: 'store-1',
      customerEmail: 'test@example.com',
      serviceOptions: {
        bookingDateTime: new Date('2026-01-20T10:00:00Z'),
      },
    });

    expect(orderResult).toBeDefined();
    expect(orderResult.orderId).toBe('service-order-1');
  });

  // ============================================================
  // TESTS D'ERREUR
  // ============================================================

  it('should handle product not found error', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await expect(
      result.current.mutateAsync({
        productId: 'invalid-product',
        storeId: 'store-1',
        customerEmail: 'test@example.com',
      })
    ).rejects.toThrow('Produit non trouvé');
  });

  it('should handle missing shipping address for physical product', async () => {
    const mockProduct = {
      id: 'product-2',
      product_type: 'physical',
      name: 'Physical Product',
      price: 49.99,
      currency: 'EUR',
    };

    const mockPhysicalProduct = { id: 'physical-product-1' };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPhysicalProduct, error: null }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await expect(
      result.current.mutateAsync({
        productId: 'product-2',
        storeId: 'store-1',
        customerEmail: 'test@example.com',
        physicalOptions: {},
      })
    ).rejects.toThrow('Adresse de livraison requise');
  });

  it('should handle missing booking date for service product', async () => {
    const mockProduct = {
      id: 'product-3',
      product_type: 'service',
      name: 'Service Product',
      price: 99.99,
      currency: 'EUR',
    };

    const mockServiceProduct = { id: 'service-product-1' };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockServiceProduct, error: null }),
    });

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await expect(
      result.current.mutateAsync({
        productId: 'product-3',
        storeId: 'store-1',
        customerEmail: 'test@example.com',
        serviceOptions: {},
      })
    ).rejects.toThrow('Date et heure de réservation requises');
  });
});
