import { describe, expect, it } from 'vitest';
import { nestMarketplaceStoreFields } from '@/lib/marketplace/nest-store-fields';
import { transformToUnifiedProduct } from '@/lib/product-transform';

describe('nestMarketplaceStoreFields', () => {
  it('nests flat store_logo_url into stores.logo_url', () => {
    const nested = nestMarketplaceStoreFields({
      id: 'p1',
      store_id: 's1',
      store_name: 'Ecom Web',
      store_slug: 'ecom-web',
      store_logo_url: 'https://cdn.example/logo.png',
      created_at: '2026-01-01T00:00:00Z',
    });
    expect(nested.stores?.logo_url).toBe('https://cdn.example/logo.png');
    expect(nested.stores?.name).toBe('Ecom Web');
  });

  it('maps store_appearance.logo_url when stores.logo_url is absent', () => {
    const nested = nestMarketplaceStoreFields({
      id: 'p1',
      store_id: 's1',
      created_at: '2026-01-01T00:00:00Z',
      stores: {
        id: 's1',
        name: 'Ecom Web',
        slug: 'ecom-web',
        logo_url: null,
        created_at: '2026-01-01T00:00:00Z',
        store_appearance: { logo_url: 'https://cdn.example/from-appearance.png' },
      } as never,
    });
    expect(nested.stores?.logo_url).toBe('https://cdn.example/from-appearance.png');
  });

  it('maps store_appearance array embed', () => {
    const nested = nestMarketplaceStoreFields({
      id: 'p1',
      store_id: 's1',
      created_at: '2026-01-01T00:00:00Z',
      stores: {
        id: 's1',
        name: 'Ecom Web',
        slug: 'ecom-web',
        logo_url: null,
        created_at: '2026-01-01T00:00:00Z',
        store_appearance: [{ logo_url: 'https://cdn.example/array.png' }],
      } as never,
    });
    expect(nested.stores?.logo_url).toBe('https://cdn.example/array.png');
  });
});

describe('transformToUnifiedProduct store logo', () => {
  it('maps nested stores.logo_url', () => {
    const unified = transformToUnifiedProduct({
      id: 'p1',
      name: 'Service',
      slug: 'service',
      price: 1000,
      created_at: '2026-01-01T00:00:00Z',
      product_type: 'service',
      store_id: 's1',
      stores: {
        id: 's1',
        name: 'Ecom Web',
        slug: 'ecom-web',
        logo_url: 'https://cdn.example/logo.png',
      },
    });
    expect(unified.store?.logo_url).toBe('https://cdn.example/logo.png');
  });

  it('maps flat store_logo_url when stores is missing', () => {
    const unified = transformToUnifiedProduct({
      id: 'p1',
      name: 'Service',
      slug: 'service',
      price: 1000,
      created_at: '2026-01-01T00:00:00Z',
      product_type: 'service',
      store_id: 's1',
      store_name: 'Ecom Web',
      store_slug: 'ecom-web',
      store_logo_url: 'https://cdn.example/logo.png',
    } as never);
    expect(unified.store?.logo_url).toBe('https://cdn.example/logo.png');
  });

  it('maps store_appearance array on stores', () => {
    const unified = transformToUnifiedProduct({
      id: 'p1',
      name: 'Service',
      slug: 'service',
      price: 1000,
      created_at: '2026-01-01T00:00:00Z',
      product_type: 'service',
      store_id: 's1',
      stores: {
        id: 's1',
        name: 'Ecom Web',
        slug: 'ecom-web',
        store_appearance: [{ logo_url: 'https://cdn.example/array.png' }],
      },
    });
    expect(unified.store?.logo_url).toBe('https://cdn.example/array.png');
  });
});
