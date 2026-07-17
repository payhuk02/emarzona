import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useStorefrontReviews } from '@/hooks/useStorefrontReviews';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useStorefrontReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mapped reviews for store products', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [{ id: 'p1' }], error: null }),
            }),
          }),
        } as never;
      }
      return {
        select: () => ({
          in: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'r1',
                      product_id: 'p1',
                      rating: 5,
                      content: 'Excellent',
                      created_at: '2026-01-01T00:00:00Z',
                      products: { name: 'Pack digital', product_type: 'digital' },
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      } as never;
    });

    const { result } = renderHook(() => useStorefrontReviews('store-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        id: 'r1',
        rating: 5,
        comment: 'Excellent',
        created_at: '2026-01-01T00:00:00Z',
        product: { name: 'Pack digital', product_type: 'digital' },
      },
    ]);
  });
});
