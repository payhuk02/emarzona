import { describe, expect, it } from 'vitest';
import {
  appearanceFormToPreviewDraft,
  hasAppearanceDraftChanges,
} from '@/lib/storefront/store-preview-draft';
import type { Store } from '@/hooks/useStores';

const baseStore = {
  id: 'store-1',
  name: 'Test',
  slug: 'test',
  primary_color: '#111111',
  logo_url: null,
  banner_url: null,
  watermark_url: null,
  placeholder_image_url: null,
} as Store;

describe('store-preview-draft', () => {
  it('maps watermark and placeholder from appearance form', () => {
    const draft = appearanceFormToPreviewDraft({
      watermarkUrl: 'https://cdn.example/w.png',
      placeholderImageUrl: 'https://cdn.example/p.png',
    });

    expect(draft.watermark_url).toBe('https://cdn.example/w.png');
    expect(draft.placeholder_image_url).toBe('https://cdn.example/p.png');
  });

  it('detects unpublished appearance changes', () => {
    expect(
      hasAppearanceDraftChanges(baseStore, {
        primaryColor: '#222222',
      })
    ).toBe(true);

    expect(
      hasAppearanceDraftChanges(baseStore, {
        primaryColor: '#111111',
      })
    ).toBe(false);
  });
});
