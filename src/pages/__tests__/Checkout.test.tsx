/**
 * Tests unitaires pour la page Checkout (panier unifié).
 * Le composant est volumineux ; les scénarios E2E couvrent le flux complet.
 */

import { describe, it, expect } from 'vitest';
import { buildOrderItemRows } from '@/lib/checkout-order-items';
import type { CartItem } from '@/types/cart';

describe('Checkout order items (panier)', () => {
  it('rejette les services dans le panier', async () => {
    const items: CartItem[] = [
      {
        id: '1',
        cart_id: 'c1',
        product_id: 'p1',
        product_name: 'Service',
        product_type: 'service',
        unit_price: 1000,
        quantity: 1,
        currency: 'XOF',
      },
    ];

    await expect(buildOrderItemRows('order-1', items)).rejects.toThrow(/services/i);
  });
});
