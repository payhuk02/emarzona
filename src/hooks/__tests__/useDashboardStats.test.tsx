/**
 * Tests pour le hook useDashboardStats
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStats } from '@/hooks/useDashboardStats';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-store-id',
          name: 'Test Store',
        },
        error: null,
      }),
      count: vi.fn().mockResolvedValue({
        data: [{ count: 10 }],
        error: null,
      }),
    })),
  },
}));

// Mock useStore
vi.mock('@/hooks/use-store', () => ({
  useStore: vi.fn(() => ({
    store: { id: 'test-store-id' },
    loading: false,
  })),
}));

describe('useDashboardStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('returns stats data structure', async () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });
  });

  it('returns stats structure with default values', async () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
      expect(result.current.stats.totalProducts).toBeDefined();
      expect(result.current.stats.totalOrders).toBeDefined();
    }, { timeout: 3000 });
  });
});

