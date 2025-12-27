/**
 * Tests pour le hook useProducts
 * Couvre la récupération et la gestion des produits
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'product-1',
            store_id: 'store-1',
            name: 'Test Product',
            slug: 'test-product',
            price: 1000,
            currency: 'XOF',
            is_active: true,
          },
        ],
        error: null,
      }),
    })),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('useProducts', () => {
  let  queryClient: QueryClient;
  let  wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('should fetch products for a store', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
    expect(Array.isArray(result.current.products)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useProducts(null), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProducts('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});






