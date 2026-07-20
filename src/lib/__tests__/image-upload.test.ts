import { describe, expect, it } from 'vitest';
import { PRODUCT_IMAGES_BUCKET, STORE_ASSETS_BUCKET, resolveImageBucket } from '@/lib/image-upload';

describe('image-upload buckets', () => {
  it('uses store-assets for store media when storeId is provided', () => {
    expect(resolveImageBucket('store-logo', 'store-uuid')).toBe(STORE_ASSETS_BUCKET);
    expect(resolveImageBucket('store-banner', 'store-uuid')).toBe(STORE_ASSETS_BUCKET);
  });

  it('falls back to product-images without storeId', () => {
    expect(resolveImageBucket('store-logo')).toBe(PRODUCT_IMAGES_BUCKET);
    expect(resolveImageBucket('product-image')).toBe(PRODUCT_IMAGES_BUCKET);
  });
});
