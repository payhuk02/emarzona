import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock toast to avoid side effects in tests
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

// Mock Supabase client
const selectChain = {
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      order: selectChain.order,
      eq: selectChain.eq,
    })),
  },
}));

import { useProducts } from '../useProducts';

describe('useProducts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty list when no storeId', async () => {
    const { result } = renderHook(() => useProducts(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual([]);
  });

  it('fetches products for a storeId', async () => {
    // Arrange
    (selectChain as any).then = undefined; // ensure not treated as a Promise
    (selectChain as any).order.mockResolvedValueOnce({ data: [
      { id: 'p1', store_id: 's1', name: 'Product 1', slug: 'p1', description: null, price: 1000, currency: 'XOF', image_url: null, category: null, product_type: 'digital', rating: 0, reviews_count: 0, is_active: true, digital_file_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ], error: null });

    const { result } = renderHook(() => useProducts('s1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products.length).toBe(1);
    expect(result.current.products[0].name).toBe('Product 1');
  });

  it('handles errors gracefully', async () => {
    (selectChain as any).order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => useProducts('s1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products).toEqual([]);
  });
});


