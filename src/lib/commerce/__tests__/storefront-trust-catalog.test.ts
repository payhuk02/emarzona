import { describe, expect, it } from 'vitest';
import {
  filterStorefrontProducts,
  getAllowedStorefrontProductTypes,
  productMatchesStoreCommerceType,
} from '@/lib/commerce/storefront-catalog';
import {
  resolveStoreActiveClients,
  resolveStoreIsVerified,
  resolveStorePublicTrust,
} from '@/lib/commerce/store-public-trust';

describe('storefront-catalog', () => {
  it('restricts digital stores to digital products by default', () => {
    const products = [
      { id: '1', product_type: 'digital' },
      { id: '2', product_type: 'physical' },
    ];
    expect(filterStorefrontProducts(products, 'digital')).toEqual([
      { id: '1', product_type: 'digital' },
    ]);
  });

  it('allows cross-type catalog when metadata flag is enabled', () => {
    expect(
      getAllowedStorefrontProductTypes('digital', { cross_type_bundles_enabled: true })
    ).toContain('physical');
    expect(
      productMatchesStoreCommerceType('physical', 'digital', { cross_type_bundles_enabled: true })
    ).toBe(true);
  });

  it('keeps service stores single-vertical', () => {
    expect(productMatchesStoreCommerceType('digital', 'service')).toBe(false);
    expect(productMatchesStoreCommerceType('service', 'service')).toBe(true);
  });
});

describe('store-public-trust', () => {
  it('marks store verified when domain is verified', () => {
    expect(resolveStoreIsVerified({ domain_status: 'verified' })).toBe(true);
  });

  it('marks store verified from metadata kyc', () => {
    expect(resolveStoreIsVerified({ metadata: { kyc_status: 'verified' } })).toBe(true);
  });

  it('prefers stored active_clients over computed fallback', () => {
    expect(resolveStoreActiveClients(42, 10)).toBe(42);
    expect(resolveStoreActiveClients(0, 7)).toBe(7);
  });

  it('builds public trust payload', () => {
    expect(
      resolveStorePublicTrust({ domain_status: 'verified', active_clients: 0, metadata: null }, 3)
    ).toEqual({ isVerified: true, activeClients: 3 });
  });
});
