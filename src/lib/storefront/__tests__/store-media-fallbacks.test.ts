import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRODUCT_PLACEHOLDER,
  resolveStoreProductImageUrl,
  resolveStoreProductPlaceholderUrl,
  resolveStoreWatermarkUrl,
} from '@/lib/storefront/store-media-fallbacks';

describe('store-media-fallbacks', () => {
  it('returns store placeholder when configured', () => {
    expect(
      resolveStoreProductPlaceholderUrl({ placeholder_image_url: 'https://cdn.example/p.png' })
    ).toBe('https://cdn.example/p.png');
  });

  it('falls back to default product placeholder', () => {
    expect(resolveStoreProductPlaceholderUrl(null)).toBe(DEFAULT_PRODUCT_PLACEHOLDER);
  });

  it('prefers product image over store placeholder', () => {
    expect(
      resolveStoreProductImageUrl('https://cdn.example/product.jpg', {
        placeholder_image_url: 'https://cdn.example/p.png',
      })
    ).toBe('https://cdn.example/product.jpg');
  });

  it('uses store placeholder when product has no image', () => {
    expect(
      resolveStoreProductImageUrl(null, {
        placeholder_image_url: 'https://cdn.example/p.png',
      })
    ).toBe('https://cdn.example/p.png');
  });

  it('returns watermark url when set', () => {
    expect(resolveStoreWatermarkUrl({ watermark_url: 'https://cdn.example/w.png' })).toBe(
      'https://cdn.example/w.png'
    );
  });

  it('returns null watermark when unset', () => {
    expect(resolveStoreWatermarkUrl({ watermark_url: '' })).toBeNull();
  });
});
