import { describe, expect, it } from 'vitest';
import {
  computeHasUnpublishedAppearanceDraft,
  publishedAppearanceBaselineFromStore,
} from '@/lib/storefront/store-appearance-form-state';
import type { Store } from '@/hooks/useStores';

describe('store appearance form state', () => {
  it('detects unpublished when form differs from published baseline', () => {
    const store = {
      id: 's1',
      name: 'Shop',
      slug: 'shop',
      primary_color: '#111111',
    } as Store;

    const baseline = publishedAppearanceBaselineFromStore(store);
    const unpublished = computeHasUnpublishedAppearanceDraft({
      store,
      form: { ...baseline, primaryColor: '#222222' },
      hasRemoteDraft: false,
      publishedBaseline: baseline,
    });

    expect(unpublished).toBe(true);
  });

  it('returns false after publish baseline matches form', () => {
    const store = {
      id: 's1',
      name: 'Shop',
      slug: 'shop',
      primary_color: '#111111',
    } as Store;

    const baseline = publishedAppearanceBaselineFromStore(store);
    const published = computeHasUnpublishedAppearanceDraft({
      store,
      form: baseline,
      hasRemoteDraft: false,
      publishedBaseline: baseline,
    });

    expect(published).toBe(false);
  });

  it('returns true when remote draft flag is set', () => {
    const store = { id: 's1', name: 'Shop', slug: 'shop' } as Store;

    expect(
      computeHasUnpublishedAppearanceDraft({
        store,
        form: {},
        hasRemoteDraft: true,
        publishedBaseline: null,
      })
    ).toBe(true);
  });
});
