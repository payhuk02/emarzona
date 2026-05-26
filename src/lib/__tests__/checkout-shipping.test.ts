import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCheckoutShippingAmount } from '../checkout-shipping';
import { calculateArtistShipping } from '@/lib/shipping/artist-shipping';
import type { CartItem } from '@/types/cart';

vi.mock('@/lib/shipping/artist-shipping', () => ({
  calculateArtistShipping: vi.fn(() =>
    Promise.resolve({
      total_shipping: 12000,
      base_shipping: 10000,
      insurance_cost: 1000,
      packaging_cost: 500,
      special_handling_cost: 500,
      currency: 'XOF',
      estimated_delivery_days: 7,
      carrier_recommendations: [],
      quote_source: 'fedex',
    })
  ),
}));

vi.mock('@/lib/shipping/fedex-rates-client', () => ({
  fetchCheapestFedexShippingCost: vi.fn(() => Promise.resolve(7500)),
}));

const artistItem = (): CartItem => ({
  product_id: 'art-1',
  product_type: 'artist',
  product_name: 'Oeuvre',
  quantity: 1,
  unit_price: 200000,
  currency: 'XOF',
});

const physicalItem = (): CartItem => ({
  product_id: 'p1',
  product_type: 'physical',
  product_name: 'T-shirt',
  quantity: 1,
  unit_price: 5000,
  currency: 'XOF',
});

describe('resolveCheckoutShippingAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 0 sans produit expédiable', async () => {
    const amount = await resolveCheckoutShippingAmount(
      [{ ...physicalItem(), product_type: 'digital' }],
      { country: 'BF', postal_code: '01' }
    );
    expect(amount).toBe(0);
  });

  it('calcule le shipping physique via FedEx mock', async () => {
    const amount = await resolveCheckoutShippingAmount([physicalItem()], {
      country: 'BF',
      postal_code: '01',
    });
    expect(amount).toBe(7500);
  });

  it('agrège le shipping artiste via calculateArtistShipping', async () => {
    const amount = await resolveCheckoutShippingAmount([artistItem()], {
      country: 'FR',
      postal_code: '75001',
    });
    expect(calculateArtistShipping).toHaveBeenCalled();
    expect(amount).toBe(12000);
  });
});
