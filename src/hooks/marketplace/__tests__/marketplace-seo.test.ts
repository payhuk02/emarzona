import { describe, it, expect } from 'vitest';
import { buildMarketplaceSEO, buildMarketplaceBreadcrumbs } from '@/lib/marketplace-seo';
import { FilterState } from '@/types/marketplace';

const baseFilters: FilterState = {
  search: '',
  category: 'all',
  productType: 'all',
  licensingType: 'all',
  priceRange: 'all',
  rating: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
  viewMode: 'grid',
  tags: [],
  verifiedOnly: false,
  featuredOnly: false,
  inStock: true,
};

describe('marketplace-seo', () => {
  it('builds type-specific title and canonical URL', () => {
    const seo = buildMarketplaceSEO(
      { ...baseFilters, productType: 'digital' },
      { totalProducts: 42, searchQuery: '', origin: 'https://www.emarzona.com' }
    );
    expect(seo.title).toContain('Produits digitaux');
    expect(seo.title).toContain('42');
    expect(seo.url).toBe('https://www.emarzona.com/marketplace?type=digital');
  });

  it('builds search breadcrumb trail', () => {
    const crumbs = buildMarketplaceBreadcrumbs(baseFilters, 'ebook', 'https://www.emarzona.com');
    expect(crumbs.length).toBeGreaterThanOrEqual(3);
    expect(crumbs[crumbs.length - 1].name).toBe('Recherche');
  });
});
