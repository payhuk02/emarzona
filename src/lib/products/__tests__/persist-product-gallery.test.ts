import { describe, expect, it } from 'vitest';
import { galleryFieldsChanged } from '@/lib/products/persist-product-gallery';

describe('galleryFieldsChanged', () => {
  it('detects delete of primary image', () => {
    expect(
      galleryFieldsChanged(
        { images: ['https://cdn.example/old.jpg'], image_url: 'https://cdn.example/old.jpg' },
        { images: [], image_url: '' }
      )
    ).toBe(true);
  });

  it('detects replace with new url', () => {
    expect(
      galleryFieldsChanged(
        { images: ['https://cdn.example/old.jpg'], image_url: 'https://cdn.example/old.jpg' },
        { images: ['https://cdn.example/new.jpg'], image_url: 'https://cdn.example/new.jpg' }
      )
    ).toBe(true);
  });

  it('is false when gallery unchanged', () => {
    expect(
      galleryFieldsChanged(
        { images: ['https://cdn.example/a.jpg'], image_url: 'https://cdn.example/a.jpg' },
        { images: ['https://cdn.example/a.jpg'], image_url: 'https://cdn.example/a.jpg' }
      )
    ).toBe(false);
  });
});
