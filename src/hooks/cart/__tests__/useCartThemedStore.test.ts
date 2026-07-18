import { describe, expect, it } from 'vitest';
import { getCartItemStoreId } from '@/lib/checkout/cart-validation';

function resolveSingleCartStoreId(
  items: Array<{ product_type: string; metadata?: Record<string, unknown> | null }>
) {
  const storeIds = items
    .map(item =>
      getCartItemStoreId({
        id: 'x',
        product_id: 'p',
        product_name: 'n',
        product_type: item.product_type as 'physical',
        quantity: 1,
        unit_price: 1,
        metadata: item.metadata ?? null,
      })
    )
    .filter((id): id is string => Boolean(id));
  const unique = new Set(storeIds);
  if (unique.size !== 1) return null;
  return storeIds[0] ?? null;
}

describe('useCartThemedStore store resolution', () => {
  it('returns store id for single-store cart', () => {
    expect(
      resolveSingleCartStoreId([
        { product_type: 'physical', metadata: { store_id: 'store-a' } },
        { product_type: 'digital', metadata: { store_id: 'store-a' } },
      ])
    ).toBe('store-a');
  });

  it('returns null for multi-store cart', () => {
    expect(
      resolveSingleCartStoreId([
        { product_type: 'physical', metadata: { store_id: 'store-a' } },
        { product_type: 'physical', metadata: { store_id: 'store-b' } },
      ])
    ).toBeNull();
  });
});
