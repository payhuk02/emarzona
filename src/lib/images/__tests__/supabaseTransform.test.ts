import { describe, expect, it } from 'vitest';
import {
  buildTransformedUrl,
  buildProductImageUrl,
  buildProductSrcSet,
  getProductImageDimensions,
  toObjectPublicUrl,
} from '@/lib/images/supabaseTransform';

const OBJECT_URL =
  'https://abc.supabase.co/storage/v1/object/public/product-images/products/demo.jpg';

describe('supabaseTransform', () => {
  it('keeps object/public URLs by default (transforms off)', () => {
    const url = buildTransformedUrl(OBJECT_URL, {
      width: 480,
      height: 320,
      quality: 82,
      resize: 'cover',
      format: 'webp',
    });
    expect(url).toBe(OBJECT_URL);
  });

  it('converts to render/image when forceTransform is set', () => {
    const url = buildTransformedUrl(OBJECT_URL, {
      width: 480,
      height: 320,
      quality: 82,
      resize: 'cover',
      format: 'webp',
      forceTransform: true,
    });
    expect(url).toContain('/storage/v1/render/image/public/product-images/products/demo.jpg');
    expect(url).toContain('width=480');
    expect(url).toContain('height=320');
    expect(url).toContain('quality=82');
    expect(url).toContain('resize=cover');
    expect(url).toContain('format=webp');
  });

  it('rewrites render URLs back to object when transforms are off', () => {
    const render =
      'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=100';
    expect(buildTransformedUrl(render, { width: 640 })).toBe(
      'https://abc.supabase.co/storage/v1/object/public/product-images/x.png'
    );
  });

  it('rewrites existing render URLs when forceTransform is set', () => {
    const render =
      'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=100';
    const url = buildTransformedUrl(render, {
      width: 640,
      format: 'avif',
      quality: 70,
      forceTransform: true,
    });
    expect(url).toBe(
      'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=640&quality=70&format=avif'
    );
  });

  it('toObjectPublicUrl converts render → object', () => {
    expect(
      toObjectPublicUrl(
        'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=100'
      )
    ).toBe('https://abc.supabase.co/storage/v1/object/public/product-images/x.png');
  });

  it('leaves non-Supabase and data URLs unchanged', () => {
    expect(buildTransformedUrl('/images/hero/x.png', { width: 100 })).toBe('/images/hero/x.png');
    expect(buildTransformedUrl('data:image/png;base64,aaa', { width: 100 })).toBe(
      'data:image/png;base64,aaa'
    );
  });

  it('buildProductImageUrl returns object URL by default', () => {
    const url = buildProductImageUrl(OBJECT_URL, 'grid', { format: 'webp' });
    expect(url).toBe(OBJECT_URL);
  });

  it('buildProductSrcSet is empty when transforms are off', () => {
    expect(buildProductSrcSet(OBJECT_URL, 'thumbnail', { format: 'webp' })).toBe('');
  });

  it('buildProductSrcSet emits widths when forceTransform is set', () => {
    const srcSet = buildProductSrcSet(OBJECT_URL, 'thumbnail', {
      format: 'webp',
      forceTransform: true,
    });
    const parts = srcSet.split(', ');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]).toMatch(/ 192w$/);
  });

  it('getProductImageDimensions returns grid defaults', () => {
    expect(getProductImageDimensions('grid')).toEqual({ width: 480, height: 320 });
  });
});
