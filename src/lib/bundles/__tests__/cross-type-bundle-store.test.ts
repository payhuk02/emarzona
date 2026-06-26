import { describe, expect, it } from 'vitest';
import { assertCrossTypeBundleLines } from '@/lib/bundles/cross-type-bundle-store';

describe('assertCrossTypeBundleLines', () => {
  it('accepts two distinct product types', () => {
    expect(() =>
      assertCrossTypeBundleLines([
        { product_id: 'a', product_type: 'digital', quantity: 1 },
        { product_id: 'b', product_type: 'physical', quantity: 1 },
      ])
    ).not.toThrow();
  });

  it('rejects a single product type', () => {
    expect(() =>
      assertCrossTypeBundleLines([
        { product_id: 'a', product_type: 'digital', quantity: 1 },
        { product_id: 'b', product_type: 'digital', quantity: 1 },
      ])
    ).toThrow(/2 types/i);
  });

  it('rejects fewer than two lines', () => {
    expect(() =>
      assertCrossTypeBundleLines([{ product_id: 'a', product_type: 'digital', quantity: 1 }])
    ).toThrow(/2 produits/i);
  });
});
