/**
 * Tests unitaires pour la pagination dans useAffiliates
 * Date : Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAffiliates } from '../useAffiliates';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useAffiliates - Pagination', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  it('should fetch affiliates with pagination', async () => {
    const mockAffiliates = Array.from({ length: 20 }, (_, i) => ({
      id: `affiliate-${i + 1}`,
      email: `test${i + 1}@example.com`,
      affiliate_code: `TEST${String(i + 1).padStart(3, '0')}`,
    }));

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 100,
      error: null,
    });

    // Mock main query
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.range.mockResolvedValue({
      data: mockAffiliates,
      error: null,
    });

    const { result } = renderHook(
      () => useAffiliates(undefined, { page: 1, pageSize: 20 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.affiliates).toHaveLength(20);
    expect(result.current.pagination.total).toBe(100);
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.pageSize).toBe(20);
    expect(result.current.pagination.totalPages).toBe(5);
    expect(result.current.pagination.hasNextPage).toBe(true);
    expect(result.current.pagination.hasPreviousPage).toBe(false);
  });

  it('should navigate to next page', async () => {
    const mockAffiliates = Array.from({ length: 20 }, (_, i) => ({
      id: `affiliate-${i + 21}`,
      email: `test${i + 21}@example.com`,
      affiliate_code: `TEST${String(i + 21).padStart(3, '0')}`,
    }));

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 100,
      error: null,
    });

    // Mock main query
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.range.mockResolvedValue({
      data: mockAffiliates,
      error: null,
    });

    const { result } = renderHook(
      () => useAffiliates(undefined, { page: 2, pageSize: 20 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pagination.page).toBe(2);
    expect(result.current.pagination.hasPreviousPage).toBe(true);
    expect(result.current.pagination.hasNextPage).toBe(true);
  });

  it('should change page size', async () => {
    const mockAffiliates = Array.from({ length: 50 }, (_, i) => ({
      id: `affiliate-${i + 1}`,
      email: `test${i + 1}@example.com`,
      affiliate_code: `TEST${String(i + 1).padStart(3, '0')}`,
    }));

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 100,
      error: null,
    });

    // Mock main query
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.range.mockResolvedValue({
      data: mockAffiliates,
      error: null,
    });

    const { result } = renderHook(
      () => useAffiliates(undefined, { page: 1, pageSize: 50 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pagination.pageSize).toBe(50);
    expect(result.current.pagination.totalPages).toBe(2);
    expect(result.current.affiliates).toHaveLength(50);
  });

  it('should handle last page correctly', async () => {
    const mockAffiliates = Array.from({ length: 5 }, (_, i) => ({
      id: `affiliate-${i + 96}`,
      email: `test${i + 96}@example.com`,
      affiliate_code: `TEST${String(i + 96).padStart(3, '0')}`,
    }));

    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 100,
      error: null,
    });

    // Mock main query
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.range.mockResolvedValue({
      data: mockAffiliates,
      error: null,
    });

    const { result } = renderHook(
      () => useAffiliates(undefined, { page: 5, pageSize: 20 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pagination.page).toBe(5);
    expect(result.current.pagination.hasNextPage).toBe(false);
    expect(result.current.pagination.hasPreviousPage).toBe(true);
  });

  it('should handle empty results', async () => {
    // Mock count query
    const mockCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValueOnce(mockCountQuery);
    mockCountQuery.select.mockResolvedValue({
      count: 0,
      error: null,
    });

    // Mock main query
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (supabase.from as any).mockReturnValue(mockQuery);
    mockQuery.range.mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(
      () => useAffiliates(undefined, { page: 1, pageSize: 20 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.affiliates).toHaveLength(0);
    expect(result.current.pagination.total).toBe(0);
    expect(result.current.pagination.totalPages).toBe(0);
    expect(result.current.pagination.hasNextPage).toBe(false);
    expect(result.current.pagination.hasPreviousPage).toBe(false);
  });
});

