import { describe, it, expect } from 'vitest';
import { validateCheckoutCart, getCartItemStoreId } from '@/lib/checkout/cart-validation';
import type { CartItem } from '@/types/cart';

function item(overrides: Partial<CartItem> & Pick<CartItem, 'product_type'>): CartItem {
  return {
    product_id: 'prod-1',
    product_name: 'Test',
    product_type: overrides.product_type,
    quantity: 1,
    unit_price: 1000,
    currency: 'XOF',
    ...overrides,
  };
}

describe('getCartItemStoreId', () => {
  it('lit store_id depuis metadata', () => {
    expect(
      getCartItemStoreId(item({ product_type: 'physical', metadata: { store_id: 'store-a' } }))
    ).toBe('store-a');
  });
});

describe('validateCheckoutCart', () => {
  it('allows physical-only cart', () => {
    const result = validateCheckoutCart([item({ product_type: 'physical' })]);
    expect(result.canCheckout).toBe(true);
    expect(result.hasMixedWithService).toBe(false);
  });

  it('blocks service-only cart', () => {
    const result = validateCheckoutCart([item({ product_type: 'service' })]);
    expect(result.canCheckout).toBe(false);
    expect(result.serviceOnly).toBe(true);
  });

  it('allows mixed cart when services have booking metadata and same store', () => {
    const result = validateCheckoutCart([
      item({
        product_type: 'physical',
        metadata: { store_id: 'store-1', physical_product_id: 'phys-1' },
      }),
      item({
        product_type: 'service',
        metadata: {
          store_id: 'store-1',
          booking_id: 'bk-1',
          scheduled_at: '2026-06-10T10:00:00Z',
          service_product_id: 'svc-1',
        },
      }),
    ]);
    expect(result.canCheckout).toBe(true);
    expect(result.hasMixedWithService).toBe(true);
  });

  it('blocks mixed cart when service lacks booking', () => {
    const result = validateCheckoutCart([
      item({ product_type: 'physical', metadata: { store_id: 'store-1' } }),
      item({ product_type: 'service', metadata: { store_id: 'store-1' } }),
    ]);
    expect(result.canCheckout).toBe(false);
    expect(result.checkoutItems).toHaveLength(1);
  });

  it('blocks mixed cart when stores differ', () => {
    const result = validateCheckoutCart([
      item({ product_type: 'physical', metadata: { store_id: 'store-a' } }),
      item({
        product_type: 'service',
        metadata: {
          store_id: 'store-b',
          booking_id: 'bk-1',
          scheduled_at: '2026-06-10T10:00:00Z',
        },
      }),
    ]);
    expect(result.canCheckout).toBe(false);
    expect(result.message).toMatch(/même boutique/i);
  });

  it('allows multi-store cart without services', () => {
    const result = validateCheckoutCart([
      item({ product_type: 'digital', metadata: { store_id: 'store-a' } }),
      item({ product_type: 'physical', metadata: { store_id: 'store-b' } }),
    ]);
    expect(result.canCheckout).toBe(true);
  });
});
