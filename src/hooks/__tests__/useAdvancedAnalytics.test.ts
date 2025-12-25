/**
 * Tests for useAdvancedAnalytics hook
 * Date: 30 Janvier 2025
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdvancedDashboards, useAnalyticsMetrics, useCreateAdvancedDashboard } from '@/hooks/analytics/useAdvancedAnalytics';
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
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAdvancedAnalytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useAdvancedDashboards', () => {
    it('should fetch dashboards successfully', async () => {
      const mockDashboards = [
        {
          id: '1',
          store_id: 'store-1',
          user_id: 'user-1',
          name: 'Dashboard 1',
          is_active: true,
          is_default: false,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockDashboards, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useAdvancedDashboards('store-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboards);
    });

    it('should handle errors', async () => {
      const mockError = { message: 'Error fetching dashboards' };
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useAdvancedDashboards('store-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAnalyticsMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockMetrics = [
        {
          id: '1',
          store_id: 'store-1',
          total_views: 1000,
          total_clicks: 500,
          total_conversions: 50,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const { result } = renderHook(
        () => useAnalyticsMetrics('store-1', undefined, '2025-01-01', '2025-01-31'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMetrics);
    });
  });

  describe('useCreateAdvancedDashboard', () => {
    it('should create dashboard successfully', async () => {
      const mockDashboard = {
        id: '1',
        store_id: 'store-1',
        user_id: 'user-1',
        name: 'New Dashboard',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDashboard, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const { result } = renderHook(() => useCreateAdvancedDashboard(), { wrapper });

      result.current.mutate({
        store_id: 'store-1',
        user_id: 'user-1',
        name: 'New Dashboard',
      } as any);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboard);
    });
  });
});

