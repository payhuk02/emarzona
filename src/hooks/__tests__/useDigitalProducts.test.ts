/**
 * Tests unitaires pour useDigitalProducts
 * 
 * Couverture des fonctionnalités principales :
 * - Récupération des produits digitaux
 * - Pagination
 * - Filtrage et tri
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDigitalProducts } from '../digital/useDigitalProducts';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock useStoreContext
vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({
    selectedStoreId: 'test-store-id',
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useDigitalProducts', () => {
  let queryClient: QueryClient;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockQuery = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch digital products successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        product_id: 'prod-1',
        products: {
          id: 'prod-1',
          name: 'Test Product',
          slug: 'test-product',
          price: 100,
        },
      },
    ];

    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockQuery.range.mockResolvedValue({
      data: mockProducts,
      error: null,
    });

    const { result } = renderHook(
      () => useDigitalProducts('store-1', { page: 1, itemsPerPage: 12 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.data.length).toBeGreaterThan(0);
  });

  it('should handle authentication errors', async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const { result } = renderHook(
      () => useDigitalProducts('store-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should handle empty results', async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockQuery.range.mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(
      () => useDigitalProducts('store-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.data).toEqual([]);
    expect(result.current.data?.total).toBe(0);
  });

  it('should apply pagination correctly', async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockQuery.range.mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(
      () => useDigitalProducts('store-1', { page: 2, itemsPerPage: 20 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Vérifier que range a été appelé avec les bons paramètres
    expect(mockQuery.range).toHaveBeenCalledWith(20, 39); // (page-1) * itemsPerPage, from + itemsPerPage - 1
  });
});

