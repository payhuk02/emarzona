import { describe, expect, it } from 'vitest';
import { hasUnpublishedAppearance } from '@/lib/storefront/store-preview-draft';
import { omitAppearanceFromStoreUpdates } from '@/lib/storefront/store-appearance-fields';
import type { Store } from '@/hooks/useStores';

describe('store appearance publish helpers', () => {
  it('detects unpublished when appearance_draft exists', () => {
    const store = {
      id: 's1',
      name: 'Test',
      slug: 'test',
      appearance_draft: { primary_color: '#000' },
    } as Store;

    expect(hasUnpublishedAppearance(store, {})).toBe(true);
  });

  it('strips appearance fields from general store updates', () => {
    const updates = omitAppearanceFromStoreUpdates({
      name: 'Shop',
      primary_color: '#111',
      logo_url: 'https://example.com/logo.png',
    });

    expect(updates).toEqual({ name: 'Shop' });
  });
});
