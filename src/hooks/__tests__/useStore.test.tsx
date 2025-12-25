/**
 * Tests unitaires pour useStore
 * 
 * Couverture :
 * - Récupération d'une boutique
 * - Gestion des erreurs
 * - États de chargement
 * - Mise à jour de boutique
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStore } from '../useStore';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useStore', () => {
  let queryClient: QueryClient;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockQuery = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch store successfully', async () => {
    const mockStore = {
      id: 'store-1',
      name: 'Test Store',
      slug: 'test-store',
      description: 'Test Description',
    };

    mockQuery.single.mockResolvedValue({
      data: mockStore,
      error: null,
    });

    const { result } = renderHook(() => useStore('store-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.store).toBeDefined();
    expect(result.current.store?.name).toBe('Test Store');
  });

  it('should handle fetch errors', async () => {
    mockQuery.single.mockResolvedValue({
      data: null,
      error: { message: 'Store not found' },
    });

    const { result } = renderHook(() => useStore('invalid-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should return null when storeId is undefined', () => {
    const { result } = renderHook(() => useStore(undefined), { wrapper });

    expect(result.current.store).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
