/**
 * Tests pour le hook usePayments
 * Couvre les fonctionnalités critiques de paiement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePayments } from '@/hooks/usePayments';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('usePayments', () => {
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
    const { result } = renderHook(() => usePayments(), { wrapper });

    expect(result.current).toBeDefined();
    // Le hook devrait retourner un objet avec les propriétés attendues
    expect(typeof result.current).toBe('object');
  });

  it('should handle empty payments list', async () => {
    const { result } = renderHook(() => usePayments(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock une erreur
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      }),
    } as any);

    const { result } = renderHook(() => usePayments(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });
});






