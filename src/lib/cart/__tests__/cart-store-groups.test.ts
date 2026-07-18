import { describe, expect, it } from 'vitest';
import {
  groupCartItemsByStore,
  isMultiStoreCart,
  getCartItemStoreName,
} from '@/lib/cart/cart-store-groups';
import type { CartItem } from '@/types/cart';

function cartItem(overrides: Partial<CartItem> & Pick<CartItem, 'product_id'>): CartItem {
  return {
    id: overrides.id ?? 'item-1',
    product_name: overrides.product_name ?? 'Product',
    product_type: overrides.product_type ?? 'physical',
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 1000,
    currency: overrides.currency ?? 'XOF',
    ...overrides,
  };
}

describe('cart-store-groups', () => {
  it('groups items by store_id metadata', () => {
    const groups = groupCartItemsByStore([
      cartItem({
        id: 'a',
        product_id: 'p1',
        metadata: { store_id: 'store-a', store_name: 'Shop A' },
      }),
      cartItem({
        id: 'b',
        product_id: 'p2',
        metadata: { store_id: 'store-b', store_name: 'Shop B' },
      }),
      cartItem({
        id: 'c',
        product_id: 'p3',
        metadata: { store_id: 'store-a', store_name: 'Shop A' },
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.storeId === 'store-a')?.items).toHaveLength(2);
    expect(groups.find(g => g.storeId === 'store-b')?.items).toHaveLength(1);
    expect(getCartItemStoreName(groups[0]!.items[0]!)).toBe('Shop A');
  });

  it('detects multi-store cart', () => {
    expect(
      isMultiStoreCart([
        cartItem({ product_id: 'p1', metadata: { store_id: 'a' } }),
        cartItem({ product_id: 'p2', metadata: { store_id: 'b' } }),
      ])
    ).toBe(true);

    expect(
      isMultiStoreCart([
        cartItem({ product_id: 'p1', metadata: { store_id: 'a' } }),
        cartItem({ product_id: 'p2', metadata: { store_id: 'a' } }),
      ])
    ).toBe(false);
  });
});
