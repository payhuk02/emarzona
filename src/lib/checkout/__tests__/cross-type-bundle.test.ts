import { describe, expect, it } from 'vitest';
import {
  allocateBundlePrice,
  expandCheckoutCart,
  expandCrossTypeBundleItem,
  validateCrossTypeBundleLines,
} from '@/lib/checkout/cross-type-bundle';
import type { CartItem } from '@/types/cart';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { resolveCheckoutCartItems } from '@/lib/checkout/resolve-checkout-cart';

const STORE = 'store-1';

function bundleCartItem(): CartItem {
  return {
    product_id: 'bundle-sku-1',
    product_name: 'Pack Créateur',
    product_type: 'digital',
    quantity: 1,
    unit_price: 9000,
    currency: 'XOF',
    metadata: {
      store_id: STORE,
      is_cross_type_bundle: true,
      cross_type_bundle_id: 'bundle-1',
      bundle_lines: [
        {
          product_id: 'p-digital',
          product_type: 'digital',
          product_name: 'Ebook',
          quantity: 1,
          list_price: 5000,
          metadata: { digital_product_id: 'dig-1' },
        },
        {
          product_id: 'p-course',
          product_type: 'course',
          product_name: 'Masterclass',
          quantity: 1,
          list_price: 5000,
          metadata: { course_id: 'course-1' },
        },
      ],
    },
  };
}

describe('cross-type-bundle', () => {
  it('validateCrossTypeBundleLines exige 2+ types', () => {
    expect(
      validateCrossTypeBundleLines([
        {
          product_id: 'a',
          product_type: 'digital',
          product_name: 'A',
          quantity: 1,
          list_price: 100,
        },
        {
          product_id: 'b',
          product_type: 'digital',
          product_name: 'B',
          quantity: 1,
          list_price: 100,
        },
      ]).ok
    ).toBe(false);

    expect(
      validateCrossTypeBundleLines([
        {
          product_id: 'p-digital',
          product_type: 'digital',
          product_name: 'Ebook',
          quantity: 1,
          list_price: 5000,
        },
        {
          product_id: 'p-course',
          product_type: 'course',
          product_name: 'Masterclass',
          quantity: 1,
          list_price: 5000,
        },
      ]).ok
    ).toBe(true);
  });

  it('allocateBundlePrice répartit proportionnellement', () => {
    const priced = allocateBundlePrice(
      [
        {
          product_id: 'a',
          product_type: 'digital',
          product_name: 'A',
          quantity: 1,
          list_price: 3000,
        },
        {
          product_id: 'b',
          product_type: 'course',
          product_name: 'B',
          quantity: 1,
          list_price: 7000,
        },
      ],
      10000
    );

    expect(priced[0].unit_price).toBe(3000);
    expect(priced[1].unit_price).toBe(7000);
  });

  it('expandCrossTypeBundleItem produit 2 lignes checkout', () => {
    const lines = expandCrossTypeBundleItem(bundleCartItem());
    expect(lines).toHaveLength(2);
    expect(lines.map(l => l.product_type).sort()).toEqual(['course', 'digital']);
    expect(lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)).toBeCloseTo(9000, 0);
  });

  it('resolveCheckoutCartItems autorise bundle digital+course au checkout', () => {
    const { validation } = resolveCheckoutCartItems([bundleCartItem()]);
    expect(validation.canCheckout).toBe(true);
    expect(validation.checkoutItems).toHaveLength(2);
  });

  it('expandCheckoutCart + validateCheckoutCart — 4 verticaux via 2 bundles', () => {
    const bundle2: CartItem = {
      ...bundleCartItem(),
      product_id: 'bundle-2',
      unit_price: 12000,
      metadata: {
        store_id: STORE,
        is_cross_type_bundle: true,
        bundle_lines: [
          {
            product_id: 'p-physical',
            product_type: 'physical',
            product_name: 'Box',
            quantity: 1,
            list_price: 6000,
          },
          {
            product_id: 'p-artist',
            product_type: 'artist',
            product_name: 'Print',
            quantity: 1,
            list_price: 6000,
          },
        ],
      },
    };

    const expanded = expandCheckoutCart([bundleCartItem(), bundle2]);
    expect(expanded).toHaveLength(4);
    const result = validateCheckoutCart(expanded);
    expect(result.canCheckout).toBe(true);
  });
});
