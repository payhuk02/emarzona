import { describe, it, expect } from 'vitest';
import { filtersToSearchParams, parseMarketplaceSearchParams } from '@/lib/marketplace-url-filters';
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
  inStock: false,
};

describe('marketplace-url-filters', () => {
  it('round-trips main filters via URL', () => {
    const filters: FilterState = {
      ...baseFilters,
      productType: 'digital',
      category: 'templates',
      priceRange: '0-5000',
      sortBy: 'price',
      sortOrder: 'asc',
      featuredOnly: true,
    };

    const params = filtersToSearchParams(filters, 2, 'ebook');
    const parsed = parseMarketplaceSearchParams(params);

    expect(parsed.search).toBe('ebook');
    expect(parsed.page).toBe(2);
    expect(parsed.filters.productType).toBe('digital');
    expect(parsed.filters.category).toBe('templates');
    expect(parsed.filters.priceRange).toBe('0-5000');
    expect(parsed.filters.sortBy).toBe('price');
    expect(parsed.filters.sortOrder).toBe('asc');
    expect(parsed.filters.featuredOnly).toBe(true);
  });

  it('omits default values from URL', () => {
    const params = filtersToSearchParams(baseFilters, 1, '');
    expect(params.toString()).toBe('');
  });

  it('serializes inStock only when filtering en stock', () => {
    const params = filtersToSearchParams({ ...baseFilters, inStock: true }, 1, '');
    expect(params.get('inStock')).toBe('1');
    expect(params.toString()).toBe('inStock=1');
  });

  it('parses legacy inStock=0 without forcing URL rewrite', () => {
    const parsed = parseMarketplaceSearchParams(new URLSearchParams('inStock=0'));
    expect(parsed.filters.inStock).toBe(false);
  });
});
