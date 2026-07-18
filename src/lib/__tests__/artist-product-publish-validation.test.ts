import { describe, expect, it } from 'vitest';
import { validateArtistPublishFormData } from '@/lib/artist-product-publish-validation';
import type { ArtistProductFormData } from '@/types/artist-product';

const baseValid: Partial<ArtistProductFormData> = {
  artist_type: 'visual_artist',
  artwork_title: 'Sunset',
  artist_name: 'Ada Lovelace',
  artwork_medium: 'Huile sur toile',
  description: 'Description suffisamment longue pour publication.',
  price: 50000,
  images: ['https://example.com/a.jpg'],
  requires_shipping: true,
  shipping_handling_time: 7,
  edition_type: 'original',
  payment: { payment_type: 'full', percentage_rate: 30 },
};

describe('validateArtistPublishFormData', () => {
  it('accepts a complete publish payload', () => {
    expect(validateArtistPublishFormData(baseValid).valid).toBe(true);
  });

  it('requires availability slots equivalent — edition numbers for limited edition', () => {
    const result = validateArtistPublishFormData({
      ...baseValid,
      edition_type: 'limited_edition',
      edition_number: null,
      total_editions: null,
    });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(5);
  });

  it('blocks publish without artist type', () => {
    const result = validateArtistPublishFormData({ ...baseValid, artist_type: undefined });
    expect(result.failedStep).toBe(1);
  });
});
