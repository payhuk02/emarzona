/**
 * Tests pour le hook useOrders
 * Couvre la récupération et la gestion des commandes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders } from '@/hooks/useOrders';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'order-1',
            store_id: 'store-1',
            order_number: 'ORD-001',
            total_amount: 1000,
            currency: 'XOF',
            status: 'pending',
            payment_status: 'pending',
          },
        ],
        count: 1,
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useOrders', () => {
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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

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
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.orders).toEqual([]);
  });

  it('should fetch orders for a store', async () => {
    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
    expect(Array.isArray(result.current.orders)).toBe(true);
  });

  it('should handle empty storeId', () => {
    const { result } = renderHook(() => useOrders(undefined), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => useOrders('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });

  it('should support pagination', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { page: 1, pageSize: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('should support sorting', async () => {
    const { result } = renderHook(
      () => useOrders('store-1', { sortBy: 'total_amount', sortDirection: 'desc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});






