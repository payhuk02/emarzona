/**
 * Tests pour useProductManagementOptimistic
 * Hooks pour gestion produits avec optimistic updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useUpdateProductOptimistic,
  useDeleteProductOptimistic,
} from '../useProductManagementOptimistic';
import type { Product } from '../useProducts';

// ============================================================
// MOCKS
// ============================================================

const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/cache-invalidation', () => ({
  invalidateProductCache: vi.fn(),
  prefetchRelatedData: vi.fn().mockResolvedValue(undefined),
  EntityType: {
    PRODUCT: 'product',
  },
  EntityAction: {
    UPDATE: 'update',
    DELETE: 'delete',
  },
}));

vi.mock('@/hooks/useMutationWithRetry', () => ({
  useMutationWithRetry: vi.fn((config) => {
    const { mutationFn, onMutate, onError, onSuccess, onSettled } = config;
    const [isPending, setIsPending] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const mutateAsync = async (...args: any[]) => {
      setIsPending(true);
      setError(null);
      try {
        let context;
        if (onMutate) {
          context = await onMutate(...args);
        }
        const result = await mutationFn(...args);
        if (onSuccess) {
          onSuccess(result, ...args, context);
        }
        if (onSettled) {
          await onSettled(result, null, ...args, context);
        }
        setIsPending(false);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        if (onError) {
          onError(error, ...args, undefined);
        }
        if (onSettled) {
          await onSettled(undefined, error, ...args, undefined);
        }
        setIsPending(false);
        throw error;
      }
    };

    return {
      mutateAsync,
      isPending,
      error,
    };
  }),
}));

// ============================================================
// SETUP
// ============================================================

describe('useUpdateProductOptimistic', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;
  const storeId = 'store-1';

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

  it('should update product successfully', async () => {
    const productId = 'product-1';
    const mockProduct: Product = {
      id: productId,
      name: 'Original Product',
      price: 29.99,
      store_id: storeId,
      product_type: 'digital',
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProduct: Product = {
      ...mockProduct,
      name: 'Updated Product',
      price: 39.99,
    };

    // Set initial cache
    queryClient.setQueryData(['product', productId], mockProduct);
    queryClient.setQueryData(['products', storeId], [mockProduct]);

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedProduct, error: null }),
    });

    const { result } = renderHook(() => useUpdateProductOptimistic(storeId), { wrapper });

    await result.current.mutateAsync({
      productId,
      updates: { name: 'Updated Product', price: 39.99 },
    });

    await waitFor(() => {
      const cachedProduct = queryClient.getQueryData<Product>(['product', productId]);
      expect(cachedProduct?.name).toBe('Updated Product');
      expect(cachedProduct?.price).toBe(39.99);
    });
  });

  it('should handle update error and rollback', async () => {
    const productId = 'product-1';
    const mockProduct: Product = {
      id: productId,
      name: 'Original Product',
      price: 29.99,
      store_id: storeId,
      product_type: 'digital',
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set initial cache
    queryClient.setQueryData(['product', productId], mockProduct);
    queryClient.setQueryData(['products', storeId], [mockProduct]);

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      }),
    });

    const { result } = renderHook(() => useUpdateProductOptimistic(storeId), { wrapper });

    await expect(
      result.current.mutateAsync({
        productId,
        updates: { name: 'Updated Product' },
      })
    ).rejects.toThrow();

    // Should rollback to original
    await waitFor(() => {
      const cachedProduct = queryClient.getQueryData<Product>(['product', productId]);
      expect(cachedProduct?.name).toBe('Original Product');
    });
  });
});

describe('useDeleteProductOptimistic', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;
  const storeId = 'store-1';

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

  it('should delete product successfully', async () => {
    const productId = 'product-1';
    const mockProduct: Product = {
      id: productId,
      name: 'Product to Delete',
      price: 29.99,
      store_id: storeId,
      product_type: 'digital',
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set initial cache
    queryClient.setQueryData(['product', productId], mockProduct);
    queryClient.setQueryData(['products', storeId], [mockProduct]);

    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useDeleteProductOptimistic(storeId), { wrapper });

    await result.current.mutateAsync(productId);

    await waitFor(() => {
      const cachedProducts = queryClient.getQueryData<Product[]>(['products', storeId]);
      expect(cachedProducts).toEqual([]);
      const cachedProduct = queryClient.getQueryData<Product>(['product', productId]);
      expect(cachedProduct).toBeUndefined();
    });
  });

  it('should handle delete error and rollback', async () => {
    const productId = 'product-1';
    const mockProduct: Product = {
      id: productId,
      name: 'Product to Delete',
      price: 29.99,
      store_id: storeId,
      product_type: 'digital',
      currency: 'EUR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set initial cache
    queryClient.setQueryData(['product', productId], mockProduct);
    queryClient.setQueryData(['products', storeId], [mockProduct]);

    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
    });

    const { result } = renderHook(() => useDeleteProductOptimistic(storeId), { wrapper });

    await expect(result.current.mutateAsync(productId)).rejects.toThrow();

    // Should rollback to original
    await waitFor(() => {
      const cachedProducts = queryClient.getQueryData<Product[]>(['products', storeId]);
      expect(cachedProducts).toHaveLength(1);
      expect(cachedProducts?.[0].id).toBe(productId);
    });
  });
});
