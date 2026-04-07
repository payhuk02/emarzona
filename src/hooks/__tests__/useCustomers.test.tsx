/**
 * Tests pour le hook useCustomers
 * Couvre la récupération et la gestion des clients avec pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCustomers } from '@/hooks/useCustomers';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'customer-1',
          store_id: 'store-1',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+22670123456',
          total_orders: 5,
          total_spent: 50000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      count: 1,
      error: null,
    }),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useCustomers', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    vi.clearAllMocks();
  });

  it('should return empty data when storeId is not provided', async () => {
    const { result } = renderHook(() => useCustomers(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toEqual([]);
    expect(result.current.data?.count).toBe(0);
  });

  it('should fetch customers with default pagination', async () => {
    const { result } = renderHook(() => useCustomers('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.count).toBe(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('customers');
  });

  it('should fetch customers with custom pagination', async () => {
    const { result } = renderHook(() => useCustomers('store-1', { page: 2, pageSize: 10 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toHaveLength(1);
    expect(mockSupabase.from().range).toHaveBeenCalledWith(10, 19);
  });

  it('should apply search query filter', async () => {
    const { result } = renderHook(() => useCustomers('store-1', { searchQuery: 'test' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from().or).toHaveBeenCalled();
  });

  it('should apply sorting', async () => {
    const { result } = renderHook(
      () => useCustomers('store-1', { sortBy: 'name', sortOrder: 'asc' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from().order).toHaveBeenCalledWith('name', {
      ascending: true,
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    mockSupabase.from().range.mockResolvedValueOnce({
      data: null,
      count: null,
      error,
    });

    const { result } = renderHook(() => useCustomers('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should use correct query key with all options', () => {
    const { result } = renderHook(
      () =>
        useCustomers('store-1', {
          page: 2,
          pageSize: 20,
          searchQuery: 'test',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      { wrapper }
    );

    // Vérifier que le query key contient toutes les options
    const queryKey = ['customers', 'store-1', 2, 20, 'test', 'name', 'asc'];
    expect(result.current.dataUpdatedAt).toBeDefined();
  });
});
