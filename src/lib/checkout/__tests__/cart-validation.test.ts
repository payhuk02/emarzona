import { describe, it, expect } from 'vitest';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import type { CartItem } from '@/types/cart';

function item(overrides: Partial<CartItem> & Pick<CartItem, 'product_type'>): CartItem {
  return {
    id: 'item-1',
    product_id: 'prod-1',
    store_id: 'store-1',
    product_type: overrides.product_type,
    name: 'Test',
    quantity: 1,
    unit_price: 1000,
    ...overrides,
  } as CartItem;
}

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

  it('allows mixed cart when services have booking metadata', () => {
    const result = validateCheckoutCart([
      item({ product_type: 'digital' }),
      item({
        product_type: 'service',
        metadata: { booking_id: 'bk-1', scheduled_at: '2026-06-10T10:00:00Z' },
      }),
    ]);
    expect(result.canCheckout).toBe(true);
    expect(result.hasMixedWithService).toBe(true);
  });

  it('blocks mixed cart when service lacks booking', () => {
    const result = validateCheckoutCart([
      item({ product_type: 'physical' }),
      item({ product_type: 'service' }),
    ]);
    expect(result.canCheckout).toBe(false);
    expect(result.checkoutItems).toHaveLength(1);
  });
});
