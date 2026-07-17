import { describe, expect, it } from 'vitest';
import {
  CROSS_TYPE_BUNDLES_METADATA_FLAG,
  countDistinctProductTypes,
  hasMultiTypeCatalog,
  isCrossTypeBundlesEnabledForStore,
  isCrossTypeBundlesPath,
} from '@/lib/commerce/cross-type-bundle-access';
import { canAccessCommercePath } from '@/lib/commerce/store-capability-map';

describe('cross-type-bundle-access', () => {
  it('detects cross-type bundle paths', () => {
    expect(isCrossTypeBundlesPath('/dashboard/cross-type-bundles')).toBe(true);
    expect(isCrossTypeBundlesPath('/dashboard/cross-type-bundles/')).toBe(true);
    expect(isCrossTypeBundlesPath('/dashboard/cross-type-bundles/edit')).toBe(true);
    expect(isCrossTypeBundlesPath('/dashboard/coupons')).toBe(false);
  });

  it('allows physical and digital stores by default', () => {
    expect(isCrossTypeBundlesEnabledForStore({ commerceType: 'physical' })).toBe(true);
    expect(isCrossTypeBundlesEnabledForStore({ commerceType: 'digital' })).toBe(true);
  });

  it('blocks service, course and artist unless metadata opt-in', () => {
    for (const commerceType of ['service', 'course', 'artist'] as const) {
      expect(isCrossTypeBundlesEnabledForStore({ commerceType })).toBe(false);
      expect(
        isCrossTypeBundlesEnabledForStore({
          commerceType,
          storeMetadata: { [CROSS_TYPE_BUNDLES_METADATA_FLAG]: true },
        })
      ).toBe(true);
    }
  });

  it('counts distinct product types in catalog', () => {
    expect(countDistinctProductTypes([])).toBe(0);
    expect(
      countDistinctProductTypes([
        { product_type: 'digital' },
        { product_type: 'digital' },
        { product_type: 'physical' },
      ])
    ).toBe(2);
    expect(hasMultiTypeCatalog([{ product_type: 'course' }])).toBe(false);
    expect(hasMultiTypeCatalog([{ product_type: 'course' }, { product_type: 'digital' }])).toBe(
      true
    );
  });

  it('gates dashboard route by commerce type and metadata', () => {
    expect(canAccessCommercePath('/dashboard/cross-type-bundles', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/cross-type-bundles', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/cross-type-bundles', 'service')).toBe(false);
    expect(canAccessCommercePath('/dashboard/cross-type-bundles', 'course')).toBe(false);
    expect(
      canAccessCommercePath('/dashboard/cross-type-bundles', 'service', {
        storeMetadata: { cross_type_bundles_enabled: true },
      })
    ).toBe(true);
  });
});
