import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion } from '../usePromotions';
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

describe('usePromotions', () => {
  let  queryClient: QueryClient;
  let  mockFrom: ReturnType<typeof vi.fn>;
  let  mockQuery: ReturnType<typeof vi.fn>;
  let  mockSelect: ReturnType<typeof vi.fn>;
  let  mockEq: ReturnType<typeof vi.fn>;
  let  mockOrder: ReturnType<typeof vi.fn>;
  let  mockOr: ReturnType<typeof vi.fn>;
  let  mockRange: ReturnType<typeof vi.fn>;
  let  mockIlike: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    mockRange = vi.fn().mockReturnThis();
    mockIlike = vi.fn().mockReturnThis();
    mockOr = vi.fn().mockReturnThis();
    mockEq = vi.fn().mockReturnThis();
    mockOrder = vi.fn().mockReturnThis();
    mockSelect = vi.fn().mockReturnThis();

    mockQuery = {
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      or: mockOr,
      range: mockRange,
      ilike: mockIlike,
    };

    mockFrom = vi.fn().mockReturnValue(mockQuery);
    (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Fetch Promotions', () => {
    it('should return empty data when storeId is not provided', async () => {
      const { result } = renderHook(() => usePromotions({}), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([]);
      expect(result.current.data?.total).toBe(0);
    });

    it('should fetch promotions for a store', async () => {
      const mockPromotions = [
        {
          id: 'promo1',
          store_id: 'store1',
          code: 'SAVE10',
          description: '10% off',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 5000,
          max_uses: 100,
          used_count: 5,
          start_date: '2025-01-01T00:00:00Z',
          end_date: '2025-12-31T23:59:59Z',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockRange.mockResolvedValueOnce({
        data: mockPromotions,
        error: null,
        count: 1,
      });

      const { result } = renderHook(
        () => usePromotions({ storeId: 'store1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0].code).toBe('SAVE10');
      expect(result.current.data?.total).toBe(1);
    });

    it('should filter active promotions only', async () => {
      const mockPromotions = [
        {
          id: 'promo1',
          store_id: 'store1',
          code: 'ACTIVE',
          is_active: true,
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 0,
          max_uses: null,
          used_count: 0,
          start_date: null,
          end_date: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockRange.mockResolvedValueOnce({
        data: mockPromotions,
        error: null,
        count: 1,
      });

      const { result } = renderHook(
        () => usePromotions({ storeId: 'store1', activeOnly: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0].is_active).toBe(true);
    });

    it('should search promotions by code or description', async () => {
      const mockPromotions = [
        {
          id: 'promo1',
          store_id: 'store1',
          code: 'SAVE10',
          description: '10% discount',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 0,
          max_uses: null,
          used_count: 0,
          is_active: true,
          start_date: null,
          end_date: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockRange.mockResolvedValueOnce({
        data: mockPromotions,
        error: null,
        count: 1,
      });

      const { result } = renderHook(
        () => usePromotions({ storeId: 'store1', search: 'SAVE10' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0].code).toBe('SAVE10');
    });

    it('should handle pagination', async () => {
      mockRange.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 50,
      });

      const { result } = renderHook(
        () => usePromotions({ storeId: 'store1', page: 2, limit: 20 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.total).toBe(50);
      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.limit).toBe(20);
      expect(result.current.data?.totalPages).toBe(3);
    });
  });

  describe('Create Promotion', () => {
    it('should create a new promotion', async () => {
      const newPromotion = {
        store_id: 'store1',
        code: 'NEWCODE',
        description: 'New promotion',
        discount_type: 'percentage',
        discount_value: 15,
        min_purchase_amount: 10000,
        max_uses: 50,
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-12-31T23:59:59Z',
        is_active: true,
      };

      const mockInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...newPromotion, id: 'new-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), used_count: 0 },
            error: null,
          }),
        }),
      };

      mockFrom.mockReturnValueOnce(mockQuery);
      mockFrom.mockReturnValueOnce(mockInsert);

      const { result } = renderHook(() => useCreatePromotion(), { wrapper });

      await result.current.mutateAsync(newPromotion as any);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});







