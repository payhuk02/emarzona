import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrderItemRows, orderItemInsertExtras } from '../checkout-order-items';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import type { CartItem } from '@/types/cart';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  },
}));

const baseItem = (overrides: Partial<CartItem>): CartItem => ({
  product_id: 'prod-1',
  product_type: 'physical',
  product_name: 'Test',
  quantity: 1,
  unit_price: 1000,
  currency: 'XOF',
  ...overrides,
});

describe('orderItemInsertExtras', () => {
  it('ajoute auto_enroll pour les cours', () => {
    const extras = orderItemInsertExtras(
      baseItem({
        product_type: 'course',
        metadata: { course_id: 'course-1' },
      })
    );
    expect(extras.item_metadata?.auto_enroll).toBe(true);
    expect(extras.item_metadata?.course_id).toBe('course-1');
  });

  it('mappe physical_product_id depuis metadata', () => {
    const extras = orderItemInsertExtras(
      baseItem({
        product_type: 'physical',
        metadata: { physical_product_id: 'phys-1' },
      })
    );
    expect(extras.physical_product_id).toBe('phys-1');
  });
});

describe('buildOrderItemRows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejette les services dans le panier', async () => {
    const items = [baseItem({ product_type: 'service' })];
    const validation = validateCheckoutCart(items);
    expect(validation.canCheckout).toBe(false);

    await expect(buildOrderItemRows('order-1', items)).rejects.toThrow(
      validation.message ?? 'service'
    );
  });

  it('construit une ligne physique avec physical_product_id', async () => {
    const rows = await buildOrderItemRows('order-1', [
      baseItem({
        product_type: 'physical',
        metadata: { physical_product_id: 'phys-99' },
      }),
    ]);
    expect(rows[0].physical_product_id).toBe('phys-99');
    expect(rows[0].order_id).toBe('order-1');
  });
});
