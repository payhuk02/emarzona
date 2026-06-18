import { describe, expect, it } from 'vitest';
import type { CartItem } from '@/types/cart';
import { assertCompatibleCartAddition } from '@/lib/cart/mixed-cart-policy';

const physical = (storeId: string): CartItem => ({
  product_id: 'p1',
  product_type: 'physical',
  quantity: 1,
  unit_price: 1000,
  metadata: { store_id: storeId },
});

const bookedService = (storeId: string): CartItem => ({
  product_id: 's1',
  product_type: 'service',
  quantity: 1,
  unit_price: 2000,
  metadata: {
    store_id: storeId,
    booking_id: 'bk-1',
    scheduled_at: '2026-06-15T14:00:00Z',
  },
});

describe('assertCompatibleCartAddition', () => {
  it('autorise un produit physique de la même boutique après réservation service', () => {
    expect(() =>
      assertCompatibleCartAddition([bookedService('store-a')], {
        product_type: 'physical',
        storeId: 'store-a',
        metadata: { store_id: 'store-a' },
      })
    ).not.toThrow();
  });

  it('bloque un produit d’une autre boutique', () => {
    expect(() =>
      assertCompatibleCartAddition([bookedService('store-a')], {
        product_type: 'physical',
        storeId: 'store-b',
        metadata: { store_id: 'store-b' },
      })
    ).toThrow(/même boutique/i);
  });

  it('bloque une deuxième réservation service', () => {
    expect(() =>
      assertCompatibleCartAddition([bookedService('store-a'), physical('store-a')], {
        product_type: 'service',
        storeId: 'store-a',
        metadata: {
          store_id: 'store-a',
          booking_id: 'bk-2',
          scheduled_at: '2026-06-16T10:00:00Z',
        },
      })
    ).toThrow(/une seule réservation/i);
  });

  it('ignore les paniers sans service réservé', () => {
    expect(() =>
      assertCompatibleCartAddition([physical('store-a'), physical('store-b')], {
        product_type: 'physical',
        storeId: 'store-c',
      })
    ).not.toThrow();
  });
});
