import { describe, expect, it } from 'vitest';
import {
  appendProductGalleryImages,
  getDisplayGalleryImages,
  normalizeProductGallery,
  removeProductGalleryImage,
} from '@/lib/products/product-gallery-images';

describe('getDisplayGalleryImages', () => {
  it('does not fall back to image_url when images is an empty array', () => {
    expect(
      getDisplayGalleryImages({ images: [], image_url: 'https://cdn.example/old.jpg' })
    ).toEqual([]);
  });

  it('uses image_url only when images is undefined', () => {
    expect(getDisplayGalleryImages({ image_url: 'https://cdn.example/legacy.jpg' })).toEqual([
      'https://cdn.example/legacy.jpg',
    ]);
  });
});

describe('appendProductGalleryImages', () => {
  it('does not resurrect image_url after gallery was cleared', () => {
    const next = appendProductGalleryImages({ images: [], image_url: '' }, [
      'https://cdn.example/new.jpg',
    ]);
    expect(next.images).toEqual(['https://cdn.example/new.jpg']);
    expect(next.image_url).toBe('https://cdn.example/new.jpg');
  });

  it('does not prepend stale image_url when images is empty but image_url still set', () => {
    const next = appendProductGalleryImages(
      { images: [], image_url: 'https://cdn.example/old.jpg' },
      ['https://cdn.example/new.jpg']
    );
    expect(next.images).toEqual(['https://cdn.example/new.jpg']);
    expect(next.image_url).toBe('https://cdn.example/new.jpg');
  });

  it('appends to existing images without reordering', () => {
    const next = appendProductGalleryImages(
      { images: ['https://cdn.example/a.jpg'], image_url: 'https://cdn.example/a.jpg' },
      ['https://cdn.example/b.jpg']
    );
    expect(next.images).toEqual(['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']);
    expect(next.image_url).toBe('https://cdn.example/a.jpg');
  });

  it('seeds from image_url only when images is undefined', () => {
    const next = appendProductGalleryImages({ image_url: 'https://cdn.example/legacy.jpg' }, [
      'https://cdn.example/new.jpg',
    ]);
    expect(next.images).toEqual(['https://cdn.example/legacy.jpg', 'https://cdn.example/new.jpg']);
  });
});

describe('removeProductGalleryImage', () => {
  it('clears both images and image_url when removing the last image', () => {
    expect(
      removeProductGalleryImage(
        { images: ['https://cdn.example/old.jpg'], image_url: 'https://cdn.example/old.jpg' },
        0
      )
    ).toEqual({ images: [], image_url: '' });
  });
});

describe('normalizeProductGallery', () => {
  it('uses image_url when images empty', () => {
    expect(normalizeProductGallery([], 'https://cdn.example/cover.jpg')).toEqual({
      images: ['https://cdn.example/cover.jpg'],
      image_url: 'https://cdn.example/cover.jpg',
    });
  });

  it('prefers images array when present', () => {
    expect(
      normalizeProductGallery(['https://cdn.example/a.jpg'], 'https://cdn.example/other.jpg')
    ).toEqual({
      images: ['https://cdn.example/a.jpg'],
      image_url: 'https://cdn.example/a.jpg',
    });
  });
});
