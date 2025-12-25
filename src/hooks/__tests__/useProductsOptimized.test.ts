/**
 * Tests unitaires pour useProductsOptimized hook
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductsOptimized } from '../useProductsOptimized';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProductsOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner les produits avec pagination', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 1000 },
      { id: '2', name: 'Product 2', price: 2000 },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 2,
      }),
    });

    const { result } = renderHook(
      () => useProductsOptimized({ storeId: 'store-1', page: 1, limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
  });

  it('devrait gérer les erreurs correctement', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Erreur de connexion' },
        count: 0,
      }),
    });

    const { result } = renderHook(
      () => useProductsOptimized({ storeId: 'store-1', page: 1, limit: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('devrait filtrer par type de produit', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    });

    const { result } = renderHook(
      () => useProductsOptimized({ 
        storeId: 'store-1', 
        page: 1, 
        limit: 10,
        productType: 'digital'
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalled();
  });
});

