import { describe, expect, it } from 'vitest';
import { getProductStore } from '@/lib/marketplace/get-product-store';

describe('getProductStore', () => {
  it('lit product.stores', () => {
    expect(
      getProductStore({
        stores: { id: '1', name: 'Alpha', slug: 'alpha', logo_url: 'https://x/l.png' },
      })
    ).toEqual({
      id: '1',
      name: 'Alpha',
      slug: 'alpha',
      logo_url: 'https://x/l.png',
      subdomain: null,
    });
  });

  it('lit product.store', () => {
    expect(
      getProductStore({
        store: { id: '2', name: 'Beta', slug: 'beta' },
      })?.name
    ).toBe('Beta');
  });

  it('lit champs plats RPC', () => {
    expect(
      getProductStore({
        store_id: '3',
        store_name: 'Gamma',
        store_slug: 'gamma',
        store_logo_url: 'https://x/g.png',
      })
    ).toMatchObject({ id: '3', name: 'Gamma', logo_url: 'https://x/g.png' });
  });

  it('retourne null sans id+name', () => {
    expect(getProductStore({ store_id: 'x' })).toBeNull();
    expect(getProductStore(null)).toBeNull();
  });
});
