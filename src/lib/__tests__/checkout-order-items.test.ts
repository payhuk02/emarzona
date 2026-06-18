import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildOrderItemRows,
  orderItemInsertExtras,
  stripOrderItemForE2EInsert,
} from '../checkout-order-items';
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

  it('mappe booking_id et service_product_id pour les services', () => {
    const extras = orderItemInsertExtras(
      baseItem({
        product_type: 'service',
        metadata: {
          booking_id: 'bk-99',
          service_product_id: 'svc-99',
          scheduled_at: '2026-06-10T10:00:00Z',
        },
      })
    );
    expect(extras.booking_id).toBe('bk-99');
    expect(extras.service_product_id).toBe('svc-99');
    expect(extras.item_metadata?.booking_id).toBe('bk-99');
  });
});

describe('stripOrderItemForE2EInsert', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('conserve les colonnes étendues hors mode E2E', () => {
    vi.stubEnv('DEV', 'true');
    vi.stubEnv('VITE_E2E_PAYMENT_STUB', 'false');
    const row = {
      order_id: 'o1',
      product_id: 'p1',
      product_type: 'course' as const,
      product_name: 'Cours',
      quantity: 1,
      unit_price: 100,
      total_price: 100,
      item_metadata: { course_id: 'c1', auto_enroll: true },
    };
    expect(stripOrderItemForE2EInsert(row).item_metadata).toEqual({
      course_id: 'c1',
      auto_enroll: true,
    });
  });

  it('retire item_metadata et FKs en mode E2E stub', () => {
    vi.stubEnv('DEV', 'true');
    vi.stubEnv('VITE_E2E_PAYMENT_STUB', 'true');
    const row = {
      order_id: 'o1',
      product_id: 'p1',
      product_type: 'artist' as const,
      product_name: 'Oeuvre',
      quantity: 1,
      unit_price: 100,
      total_price: 100,
      item_metadata: { artist_product_id: 'a1' },
      booking_id: 'bk-1',
    };
    const stripped = stripOrderItemForE2EInsert(row);
    expect(stripped.item_metadata).toBeUndefined();
    expect(stripped.booking_id).toBeUndefined();
    expect(stripped.product_id).toBe('p1');
  });
});

describe('buildOrderItemRows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejette les services sans réservation', async () => {
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

  it('construit une ligne service mixte avec booking_id', async () => {
    const rows = await buildOrderItemRows('order-1', [
      baseItem({
        product_type: 'physical',
        metadata: { store_id: 'store-1', physical_product_id: 'phys-1' },
      }),
      baseItem({
        product_id: 'prod-svc',
        product_type: 'service',
        metadata: {
          store_id: 'store-1',
          booking_id: 'bk-1',
          service_product_id: 'svc-1',
          scheduled_at: '2026-06-10T10:00:00Z',
        },
      }),
    ]);
    expect(rows).toHaveLength(2);
    const serviceRow = rows.find(r => r.product_type === 'service');
    expect(serviceRow?.booking_id).toBe('bk-1');
    expect(serviceRow?.service_product_id).toBe('svc-1');
  });

  it('construit les 4 verticaux dans un même checkout', async () => {
    const rows = await buildOrderItemRows('order-1', [
      baseItem({
        product_id: 'p-dig',
        product_type: 'digital',
        metadata: { digital_product_id: 'dig-1' },
      }),
      baseItem({
        product_id: 'p-phys',
        product_type: 'physical',
        metadata: { physical_product_id: 'phys-1' },
      }),
      baseItem({
        product_id: 'p-course',
        product_type: 'course',
        metadata: { course_id: 'course-1' },
      }),
      baseItem({
        product_id: 'p-art',
        product_type: 'artist',
        metadata: { artist_product_id: 'art-1' },
      }),
    ]);

    expect(rows).toHaveLength(4);
    expect(rows.map(r => r.product_type).sort()).toEqual(
      ['artist', 'course', 'digital', 'physical'].sort()
    );
  });
});
