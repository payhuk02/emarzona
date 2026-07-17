import { describe, expect, it, vi } from 'vitest';
import {
  fetchCheapestCarrierShippingCost,
  listCheckoutShippingProviders,
} from '@/lib/shipping/shipping-provider';

vi.mock('@/lib/shipping/fedex-rates-client', () => ({
  fetchCheapestFedexShippingCost: vi.fn(() => Promise.resolve(5000)),
}));

const request = {
  ship_from: { country: 'BF', postal_code: '01', city: 'Ouagadougou' },
  ship_to: { country: 'FR', postal_code: '75001', city: 'Paris' },
  weight_kg: 1,
};

describe('shipping-provider', () => {
  it('lists FedEx and DHL checkout providers', () => {
    const ids = listCheckoutShippingProviders().map(p => p.id);
    expect(ids).toContain('fedex');
    expect(ids).toContain('dhl');
  });

  it('returns cheapest carrier quote (FedEx when DHL stub is null)', async () => {
    const amount = await fetchCheapestCarrierShippingCost(request);
    expect(amount).toBe(5000);
  });
});
