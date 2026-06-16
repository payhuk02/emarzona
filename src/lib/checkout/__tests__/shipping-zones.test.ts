import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStoreZoneShippingAmount } from '@/lib/checkout/shipping-zones';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn() },
}));

type ChainResult = { data: unknown; error: unknown };

function chainReturning(result: ChainResult) {
  return {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue(result),
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(result),
          in: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

describe('resolveStoreZoneShippingAmount', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns null when no country', async () => {
    const result = await resolveStoreZoneShippingAmount(
      'store-1',
      [{ product_id: 'p1' } as never],
      { country: '' } as never,
      1000
    );
    expect(result).toBeNull();
  });

  it('returns 0 when all physical products are free shipping', async () => {
    // physical_products
    fromMock
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { product_id: 'p1', free_shipping: true },
              { product_id: 'p2', free_shipping: true },
            ],
            error: null,
          }),
        }),
      })
      // stores
      .mockReturnValueOnce(
        chainReturning({
          data: { free_shipping_threshold: 0 },
          error: null,
        })
      );

    const result = await resolveStoreZoneShippingAmount(
      'store-1',
      [{ product_id: 'p1' } as never, { product_id: 'p2' } as never],
      { country: 'bf' } as never,
      1000
    );

    expect(result).toBe(0);
  });

  it('returns 0 when free shipping threshold is reached', async () => {
    // physical_products (not all free)
    fromMock
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ product_id: 'p1', free_shipping: false }],
            error: null,
          }),
        }),
      })
      // stores threshold
      .mockReturnValueOnce(
        chainReturning({
          data: { free_shipping_threshold: 500 },
          error: null,
        })
      );

    const result = await resolveStoreZoneShippingAmount(
      'store-1',
      [{ product_id: 'p1' } as never],
      { country: 'BF' } as never,
      600
    );

    expect(result).toBe(0);
  });

  it('returns cheapest eligible rate for matching zone', async () => {
    // physical_products
    fromMock
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ product_id: 'p1', free_shipping: false }],
            error: null,
          }),
        }),
      })
      // stores threshold
      .mockReturnValueOnce(
        chainReturning({
          data: { free_shipping_threshold: 0 },
          error: null,
        })
      )
      // shipping_zones
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'zone-1', countries: ['BF'] },
                { id: 'zone-2', countries: ['CI'] },
              ],
              error: null,
            }),
          }),
        }),
      })
      // shipping_rates
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                // eligible
                {
                  base_price: 2500,
                  min_order_amount: null,
                  max_order_amount: null,
                  is_active: true,
                },
                // eligible but cheaper
                {
                  base_price: 1500,
                  min_order_amount: 500,
                  max_order_amount: 2000,
                  is_active: true,
                },
                // not eligible (min too high)
                {
                  base_price: 1000,
                  min_order_amount: 5000,
                  max_order_amount: null,
                  is_active: true,
                },
              ],
              error: null,
            }),
          }),
        }),
      });

    const result = await resolveStoreZoneShippingAmount(
      'store-1',
      [{ product_id: 'p1' } as never],
      { country: 'BF' } as never,
      1000
    );

    expect(result).toBe(1500);
  });
});
