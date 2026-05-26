import { describe, it, expect, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/shipping/fedex-rates-client', () => ({
  fetchFedexRatesViaEdge: vi.fn(() =>
    Promise.resolve({
      rates: [
        {
          service_type: 'FEDEX_GROUND',
          service_name: 'FedEx Ground',
          total_cost: 18000,
          currency: 'XOF',
          estimated_days: 5,
        },
      ],
      source: 'mock',
    })
  ),
  fetchCheapestFedexShippingCost: vi.fn(() => Promise.resolve(18000)),
}));

import { resolveArtworkWeightKg, calculateArtistShipping } from '@/lib/shipping/artist-shipping';
import { fetchFedexRatesViaEdge } from '@/lib/shipping/fedex-rates-client';

function mockArtistProductRow(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        product_id: 'prod-1',
        requires_shipping: true,
        shipping_fragile: false,
        shipping_insurance_required: false,
        shipping_handling_time: 5,
        artwork_weight: null,
        artwork_dimensions: { width: 50, height: 70, depth: 5, unit: 'cm' },
        ...overrides,
      },
      error: null,
    }),
  };
  fromMock.mockReturnValue(chain);
  return chain;
}

describe('resolveArtworkWeightKg', () => {
  it('uses declared weight when number', () => {
    expect(resolveArtworkWeightKg(3.5, null)).toBe(3.5);
  });

  it('defaults to 2 kg without dimensions', () => {
    expect(resolveArtworkWeightKg(null, null)).toBe(2);
  });

  it('computes volumetric weight from dimensions', () => {
    const kg = resolveArtworkWeightKg(null, { width: 100, height: 100, depth: 10, unit: 'cm' });
    expect(kg).toBeGreaterThan(0.5);
  });
});

describe('calculateArtistShipping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses FedEx when postal code provided', async () => {
    mockArtistProductRow();

    const quote = await calculateArtistShipping(
      'prod-1',
      { country: 'FR', postal_code: '75001', city: 'Paris' },
      500000
    );

    expect(fetchFedexRatesViaEdge).toHaveBeenCalled();
    expect(quote.quote_source).toBe('fedex');
    expect(quote.base_shipping).toBe(18000);
    expect(quote.fedex_service_name).toBe('FedEx Ground');
  });

  it('falls back to heuristic without postal code', async () => {
    mockArtistProductRow();

    const quote = await calculateArtistShipping('prod-1', { country: 'BF' }, 100000);

    expect(fetchFedexRatesViaEdge).not.toHaveBeenCalled();
    expect(quote.quote_source).toBe('heuristic');
    expect(quote.base_shipping).toBeGreaterThan(0);
  });
});
