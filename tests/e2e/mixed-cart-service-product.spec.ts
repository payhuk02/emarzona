/**
 * E2E Epic 3.3.1 — Panier mixte service + produits (même vendeur)
 *
 * Niveau 1 : contrat TypeScript (validation panier + order_items)
 * npx playwright test tests/e2e/mixed-cart-service-product.spec.ts
 */

import { test, expect } from '@playwright/test';
import { validateCheckoutCart, getCartItemStoreId } from '../../src/lib/checkout/cart-validation';
import type { CartItem } from '../../src/types/cart';

const physicalItem = (storeId: string): CartItem => ({
  product_id: 'prod-phys',
  product_name: 'T-shirt',
  product_type: 'physical',
  quantity: 1,
  unit_price: 5000,
  currency: 'XOF',
  metadata: { store_id: storeId, physical_product_id: 'phys-1' },
});

const bookedServiceItem = (storeId: string): CartItem => ({
  product_id: 'prod-svc',
  product_name: 'Coiffure',
  product_type: 'service',
  quantity: 1,
  unit_price: 3000,
  currency: 'XOF',
  metadata: {
    store_id: storeId,
    booking_id: 'bk-001',
    service_product_id: 'svc-1',
    scheduled_at: '2026-06-15T14:00:00Z',
  },
});

test.describe('Epic 3.3.1 — Panier mixte service + produits', () => {
  test('autorise le checkout quand même store et réservation confirmée', () => {
    const items = [physicalItem('store-abc'), bookedServiceItem('store-abc')];
    const validation = validateCheckoutCart(items);

    expect(validation.canCheckout).toBe(true);
    expect(validation.hasMixedWithService).toBe(true);
    expect(validation.checkoutItems).toHaveLength(2);
  });

  test('bloque le panier mixte multi-boutiques', () => {
    const validation = validateCheckoutCart([
      physicalItem('store-a'),
      bookedServiceItem('store-b'),
    ]);

    expect(validation.canCheckout).toBe(false);
    expect(validation.message).toMatch(/même boutique/i);
  });

  test('bloque service sans metadata de réservation', () => {
    const validation = validateCheckoutCart([
      physicalItem('store-a'),
      {
        ...bookedServiceItem('store-a'),
        metadata: { store_id: 'store-a' },
      },
    ]);

    expect(validation.canCheckout).toBe(false);
  });

  test('conserve le checkout multi-boutiques sans service', () => {
    const validation = validateCheckoutCart([
      physicalItem('store-a'),
      { ...physicalItem('store-b'), product_id: 'prod-phys-2' },
    ]);

    expect(validation.canCheckout).toBe(true);
  });

  test('getCartItemStoreId lit metadata.store_id', () => {
    expect(getCartItemStoreId(physicalItem('store-x'))).toBe('store-x');
  });
});
