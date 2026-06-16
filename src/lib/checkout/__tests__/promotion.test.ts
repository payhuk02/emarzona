import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCheckoutPromotion } from '@/lib/checkout/promotion';

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

function mockProductsQuery(products: Array<{ category_id: string | null }>) {
  const inFn = vi.fn().mockResolvedValue({ data: products, error: null });
  const selectFn = vi.fn(() => ({ in: inFn }));
  fromMock.mockReturnValue({ select: selectFn });
  return { selectFn, inFn };
}

describe('validateCheckoutPromotion', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  it('rejects empty code', async () => {
    const result = await validateCheckoutPromotion({
      code: '   ',
      storeId: 'store-1',
      productIds: [],
      orderAmount: 1000,
    });

    expect(result).toEqual({ valid: false, message: 'Code promo requis' });
  });

  it('passes normalized code and category ids to RPC', async () => {
    mockProductsQuery([
      { category_id: 'cat-1' },
      { category_id: 'cat-1' },
      { category_id: null },
      { category_id: 'cat-2' },
    ]);

    rpcMock.mockResolvedValue({
      data: {
        valid: true,
        promotion_id: 'promo-1',
        code: 'SAVE10',
        discount_amount: 250,
        order_total_before: 1000,
        order_total_after: 750,
      },
      error: null,
    });

    const result = await validateCheckoutPromotion({
      code: ' save10 ',
      storeId: 'store-1',
      productIds: ['p1', 'p2'],
      orderAmount: 1000,
      customerId: 'cust-1',
      isFirstOrder: true,
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'validate_unified_promotion',
      expect.objectContaining({
        p_code: 'SAVE10',
        p_store_id: 'store-1',
        p_product_ids: ['p1', 'p2'],
        p_category_ids: expect.arrayContaining(['cat-1', 'cat-2']),
        p_order_amount: 1000,
        p_customer_id: 'cust-1',
        p_is_first_order: true,
      })
    );

    expect(result).toEqual({
      valid: true,
      promotion: {
        promotionId: 'promo-1',
        code: 'SAVE10',
        discountAmount: 250,
        orderTotalBefore: 1000,
        orderTotalAfter: 750,
      },
    });
  });

  it('returns a user message when RPC fails', async () => {
    mockProductsQuery([]);
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rpc down' } });

    const result = await validateCheckoutPromotion({
      code: 'SAVE10',
      storeId: 'store-1',
      productIds: [],
      orderAmount: 1000,
    });

    expect(result).toEqual({ valid: false, message: 'rpc down' });
  });

  it('returns invalid when RPC payload is not valid', async () => {
    mockProductsQuery([]);
    rpcMock.mockResolvedValue({
      data: { valid: false, error_message: 'Expired' },
      error: null,
    });

    const result = await validateCheckoutPromotion({
      code: 'SAVE10',
      storeId: 'store-1',
      productIds: [],
      orderAmount: 1000,
    });

    expect(result).toEqual({ valid: false, message: 'Expired' });
  });
});
