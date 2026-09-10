import { describe, expect, it } from 'vitest';
import {
  buildTransformedUrl,
  buildProductImageUrl,
  buildProductSrcSet,
  getProductImageDimensions,
} from '@/lib/images/supabaseTransform';

const OBJECT_URL =
  'https://abc.supabase.co/storage/v1/object/public/product-images/products/demo.jpg';

describe('supabaseTransform', () => {
  it('converts object/public URLs to render/image with params', () => {
    const url = buildTransformedUrl(OBJECT_URL, {
      width: 480,
      height: 320,
      quality: 82,
      resize: 'cover',
      format: 'webp',
    });
    expect(url).toContain('/storage/v1/render/image/public/product-images/products/demo.jpg');
    expect(url).toContain('width=480');
    expect(url).toContain('height=320');
    expect(url).toContain('quality=82');
    expect(url).toContain('resize=cover');
    expect(url).toContain('format=webp');
  });

  it('rewrites existing render URLs', () => {
    const render =
      'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=100';
    const url = buildTransformedUrl(render, { width: 640, format: 'avif', quality: 70 });
    expect(url).toBe(
      'https://abc.supabase.co/storage/v1/render/image/public/product-images/x.png?width=640&quality=70&format=avif'
    );
  });

  it('leaves non-Supabase and data URLs unchanged', () => {
    expect(buildTransformedUrl('/images/hero/x.png', { width: 100 })).toBe('/images/hero/x.png');
    expect(buildTransformedUrl('data:image/png;base64,aaa', { width: 100 })).toBe(
      'data:image/png;base64,aaa'
    );
  });

  it('buildProductImageUrl uses context dimensions', () => {
    const dims = getProductImageDimensions('grid');
    const url = buildProductImageUrl(OBJECT_URL, 'grid', { format: 'webp' });
    expect(url).toContain(`width=${dims.width}`);
    expect(url).toContain(`height=${dims.height}`);
  });

  it('buildProductSrcSet emits multiple widths', () => {
    const srcSet = buildProductSrcSet(OBJECT_URL, 'thumbnail', { format: 'webp' });
    const parts = srcSet.split(', ');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]).toMatch(/ 192w$/);
  });
});
