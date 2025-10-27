/**
 * Tests unitaires pour useReviews hooks
 * Date : 27 octobre 2025
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductReviews, useProductReviewStats, useCanReview } from '../useReviews';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: { full_name: 'Test User' },
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useReviews', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useProductReviewStats', () => {
    it('should fetch review stats successfully', async () => {
      const mockStats = {
        product_id: 'product-123',
        average_rating: 4.5,
        total_reviews: 10,
        rating_5_count: 6,
        rating_4_count: 2,
        rating_3_count: 1,
        rating_2_count: 1,
        rating_1_count: 0,
        recommended_percentage: 80,
        has_media_reviews: true,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockStats,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviewStats('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockStats);
    });

    it('should handle no stats found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviewStats('product-999'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviewStats('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useProductReviews', () => {
    it('should fetch reviews with default params', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          product_id: 'product-123',
          user_id: 'user-456',
          rating: 5,
          content: 'Great product!',
          created_at: '2025-10-27T10:00:00Z',
          is_approved: true,
        },
        {
          id: 'review-2',
          product_id: 'product-123',
          user_id: 'user-789',
          rating: 4,
          content: 'Good quality',
          created_at: '2025-10-26T10:00:00Z',
          is_approved: true,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockReviews,
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviews('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].rating).toBe(5);
    });

    it('should apply filters correctly', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviews('product-123', { min_rating: 4 }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockFrom().select().gte).toHaveBeenCalledWith('rating', 4);
    });

    it('should sort reviews by newest first by default', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useProductReviews('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockFrom().select().order).toHaveBeenCalledWith(
        'created_at',
        expect.objectContaining({ ascending: false })
      );
    });
  });

  describe('useCanReview', () => {
    it('should return true if user can review', async () => {
      // Mock: No existing review
      const mockReviewCheck = {
        data: null,
        error: null,
      };

      // Mock: User has purchased
      const mockOrderCheck = {
        data: [{ id: 'order-123' }],
        error: null,
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue(mockReviewCheck),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(mockOrderCheck),
          }),
        });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useCanReview('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(true);
    });

    it('should return false if user already reviewed', async () => {
      const mockReviewCheck = {
        data: { id: 'review-123' },
        error: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(mockReviewCheck),
        }),
      });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useCanReview('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(false);
    });

    it('should return false if user has not purchased', async () => {
      const mockReviewCheck = {
        data: null,
        error: null,
      };

      const mockOrderCheck = {
        data: [],
        error: null,
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue(mockReviewCheck),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(mockOrderCheck),
          }),
        });

      (supabase.from as any) = mockFrom;

      const { result } = renderHook(
        () => useCanReview('product-123'),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(false);
    });
  });
});

