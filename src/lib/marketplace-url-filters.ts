import { FilterState } from '@/types/marketplace';

const PRODUCT_TYPES = new Set(['digital', 'physical', 'service', 'course', 'artist']);

export interface MarketplaceUrlState {
  filters: Partial<FilterState>;
  search: string;
  page: number;
}

function parseBool(value: string | null): boolean | undefined {
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return undefined;
}

/**
 * Lit les paramètres d'URL du marketplace vers l'état filtres.
 */
export function parseMarketplaceSearchParams(params: URLSearchParams): MarketplaceUrlState {
  const filters: Partial<FilterState> = {};
  const q = params.get('q')?.trim() ?? '';
  const category = params.get('category');
  const productType = params.get('type');
  const priceRange = params.get('price');
  const rating = params.get('rating');
  const sortBy = params.get('sort');
  const sortOrder = params.get('order');
  const licensingType = params.get('license');
  const tagsRaw = params.get('tags');

  if (category) filters.category = category;
  if (productType && (productType === 'all' || PRODUCT_TYPES.has(productType))) {
    filters.productType = productType;
  }
  if (priceRange) filters.priceRange = priceRange;
  if (rating) filters.rating = rating;
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder === 'asc' || sortOrder === 'desc') filters.sortOrder = sortOrder;
  if (licensingType === 'standard' || licensingType === 'plr' || licensingType === 'copyrighted') {
    filters.licensingType = licensingType;
  }

  const featured = parseBool(params.get('featured'));
  if (featured !== undefined) filters.featuredOnly = featured;

  const verified = parseBool(params.get('verified'));
  if (verified !== undefined) filters.verifiedOnly = verified;

  const inStock = parseBool(params.get('inStock'));
  if (inStock !== undefined) filters.inStock = inStock;

  if (tagsRaw) {
    filters.tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  return { filters, search: q, page };
}

/**
 * Sérialise filtres + pagination dans URLSearchParams (valeurs par défaut omises).
 */
export function filtersToSearchParams(
  filters: FilterState,
  page: number,
  searchInput: string
): URLSearchParams {
  const params = new URLSearchParams();

  const q = (searchInput || filters.search || '').trim();
  if (q) params.set('q', q);
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.productType !== 'all') params.set('type', filters.productType);
  if (filters.priceRange !== 'all') params.set('price', filters.priceRange);
  if (filters.rating !== 'all') params.set('rating', filters.rating);
  if (filters.sortBy !== 'created_at') params.set('sort', filters.sortBy);
  if (filters.sortOrder !== 'desc') params.set('order', filters.sortOrder);
  if (filters.licensingType && filters.licensingType !== 'all') {
    params.set('license', filters.licensingType);
  }
  if (filters.featuredOnly) params.set('featured', '1');
  if (filters.verifiedOnly) params.set('verified', '1');
  if (filters.inStock) params.set('inStock', '1');
  if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (page > 1) params.set('page', String(page));

  return params;
}

export function marketplaceUrlStatesEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString();
}
