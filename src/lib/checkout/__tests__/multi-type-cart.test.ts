import { describe, expect, it } from 'vitest';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { countDistinctCartProductTypes } from '@/lib/cart/cart-product-type';
import type { CartItem } from '@/types/cart';

const STORE = 'store-emarzona';

function cartItem(
  productType: CartItem['product_type'],
  productId: string,
  meta: Record<string, unknown> = {}
): CartItem {
  return {
    product_id: productId,
    product_name: productId,
    product_type: productType,
    quantity: 1,
    unit_price: 1000,
    currency: 'XOF',
    metadata: { store_id: STORE, ...meta },
  };
}

describe('panier multi-type — 4 verticaux', () => {
  const fourVerticals = [
    cartItem('digital', 'prod-digital', { digital_product_id: 'dig-1' }),
    cartItem('physical', 'prod-physical', { physical_product_id: 'phys-1' }),
    cartItem('course', 'prod-course', { course_id: 'course-1' }),
    cartItem('artist', 'prod-artist', { artist_product_id: 'art-1' }),
  ];

  it('autorise digital + physical + course + artist sans service', () => {
    const result = validateCheckoutCart(fourVerticals);
    expect(result.canCheckout).toBe(true);
    expect(result.checkoutItems).toHaveLength(4);
    expect(countDistinctCartProductTypes(fourVerticals)).toBe(4);
  });

  it('autorise les 4 verticaux + service réservé (même boutique)', () => {
    const items = [
      ...fourVerticals,
      cartItem('service', 'prod-service', {
        booking_id: 'bk-1',
        scheduled_at: '2026-06-20T10:00:00Z',
        service_product_id: 'svc-1',
      }),
    ];

    const result = validateCheckoutCart(items);
    expect(result.canCheckout).toBe(true);
    expect(result.hasMixedWithService).toBe(true);
    expect(result.checkoutItems).toHaveLength(5);
  });

  it('bloque 4 verticaux + service si boutique différente', () => {
    const items = [
      ...fourVerticals,
      cartItem('service', 'prod-service', {
        store_id: 'other-store',
        booking_id: 'bk-2',
        scheduled_at: '2026-06-21T11:00:00Z',
      }),
    ];

    const result = validateCheckoutCart(items);
    expect(result.canCheckout).toBe(false);
    expect(result.message).toMatch(/même boutique/i);
  });
});
