import { describe, expect, it } from 'vitest';
import {
  applyGigListingPrices,
  createDefaultGigPackageDrafts,
  listingPriceFromPackages,
  validateGigExtraDrafts,
  validateGigPackageDrafts,
} from '@/lib/services/service-gig-package-drafts';

describe('gig package drafts', () => {
  it('seeds three Fiverr-style tiers from the listing price', () => {
    const drafts = createDefaultGigPackageDrafts(10000);
    expect(drafts.map(pkg => pkg.tier)).toEqual(['basic', 'standard', 'premium']);
    expect(drafts[0].price).toBe(10000);
    expect(drafts[1].price).toBe(20000);
    expect(drafts[2].price).toBe(40000);
    expect(listingPriceFromPackages(drafts)).toBe(10000);
  });

  it('rejects empty or zero-priced formulas', () => {
    expect(validateGigPackageDrafts([])[0]).toMatch(/formule/i);
    expect(
      validateGigPackageDrafts([
        {
          name: 'Basic',
          tier: 'basic',
          description: '',
          price: 0,
          delivery_days: 3,
          revisions: 1,
          featuresText: '',
          is_featured: false,
        },
      ])[0]
    ).toMatch(/formule/i);
  });
});

describe('gig extra drafts', () => {
  it('rejects a named extra without a price', () => {
    expect(
      validateGigExtraDrafts([{ name: 'Express', description: '', price: 0, extra_days: 1 }])[0]
    ).toMatch(/prix/i);
  });

  it('accepts optional empty extras', () => {
    expect(validateGigExtraDrafts([])).toEqual([]);
    expect(
      validateGigExtraDrafts([
        { name: 'Source files', description: '', price: 5000, extra_days: 0 },
      ])
    ).toEqual([]);
  });
});

describe('applyGigListingPrices', () => {
  it('sets the catalog price to the cheapest formula', () => {
    const payload: { price?: unknown; promotional_price?: unknown } = {
      price: 50000,
      promotional_price: 40000,
    };
    applyGigListingPrices(payload, createDefaultGigPackageDrafts(10000));
    expect(payload.price).toBe(10000);
    expect(payload.promotional_price).toBeNull();
  });

  it('keeps a promo only when it is below the cheapest formula', () => {
    const payload: { price?: unknown; promotional_price?: unknown } = {
      price: 50000,
      promotional_price: 8000,
    };
    applyGigListingPrices(payload, createDefaultGigPackageDrafts(10000));
    expect(payload.price).toBe(10000);
    expect(payload.promotional_price).toBe(8000);
  });
});
