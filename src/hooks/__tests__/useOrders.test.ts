import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const selectChain = {
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      eq: selectChain.eq,
      order: selectChain.order,
      range: selectChain.range,
    })),
  },
}));

import { useOrders } from '../useOrders';

describe('useOrders', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('short-circuits without storeId', async () => {
    const { result } = renderHook(() => useOrders(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('fetches paginated orders with count', async () => {
    selectChain.range.mockResolvedValueOnce({
      data: [
        { id: 'o1', store_id: 's1', order_number: '1001', total_amount: 5000, currency: 'XOF', status: 'paid', payment_status: 'paid', payment_method: 'card', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
      error: null,
      count: 1,
    });

    const { result } = renderHook(() => useOrders('s1', { page: 0, pageSize: 25 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders.length).toBe(1);
    expect(result.current.totalCount).toBe(1);
  });
});


