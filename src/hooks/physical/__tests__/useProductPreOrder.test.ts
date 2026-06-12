import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProductPreOrder } from '@/hooks/physical/useProductPreOrder';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useProductPreOrder', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset();
  });

  it('returns active pre-order from RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        id: 'po-1',
        product_id: 'prod-1',
        status: 'active',
        current_pre_orders: 2,
        reserved_quantity: 2,
        deposit_required: false,
        is_full: false,
      },
      error: null,
    } as never);

    const { result } = renderHook(() => useProductPreOrder('prod-1', 'var-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.rpc).toHaveBeenCalledWith('get_active_product_pre_order', {
      p_product_id: 'prod-1',
      p_variant_id: 'var-1',
    });
    expect(result.current.data?.id).toBe('po-1');
  });

  it('returns null when no active pre-order', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    const { result } = renderHook(() => useProductPreOrder('prod-2'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
