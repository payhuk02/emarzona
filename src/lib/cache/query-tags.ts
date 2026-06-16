/**
 * Mapping tags de cache → clés React Query.
 * Équivalent de revalidateTag() / cacheTag() pour TanStack React Query.
 */

import type { CacheTagValue } from './tags';
import { CacheTag } from './tags';

/** Préfixes React Query associés à chaque tag */
export const TAG_TO_QUERY_PREFIXES: Record<CacheTagValue, string[]> = {
  [CacheTag.PRODUCT]: ['product', 'products', 'marketplace-products', 'filtered-products'],
  [CacheTag.PRODUCTS_LIST]: ['marketplace-products', 'products', 'filtered-products'],
  [CacheTag.PRODUCT_DETAIL]: ['product', 'digitalProduct', 'physicalProduct', 'service', 'course'],
  [CacheTag.DIGITAL_PRODUCT]: ['digitalProducts', 'digitalProduct', 'productUpdates'],
  [CacheTag.PHYSICAL_PRODUCT]: ['physicalProducts', 'physicalProduct'],
  [CacheTag.SERVICE]: ['services', 'service', 'service-bookings'],
  [CacheTag.COURSE]: ['courses', 'course', 'course-stats', 'enrollments'],
  [CacheTag.ARTIST]: ['artist-products', 'artist-portfolios'],
  [CacheTag.ARTIST_COLLECTION]: ['artist-collections', 'collections'],
  [CacheTag.AUCTION]: ['auctions', 'auction'],
  [CacheTag.STORE]: ['stores', 'store'],
  [CacheTag.STORE_DETAIL]: ['store', 'stores'],
  [CacheTag.CATEGORY]: ['categories', 'marketplace-facets'],
  [CacheTag.COLLECTION]: ['collections', 'artist-collections'],
  [CacheTag.SEARCH]: ['product-search', 'search-suggestions', 'popular-searches'],
  [CacheTag.FACETS]: ['marketplace-facets'],
  [CacheTag.RECOMMENDATIONS]: ['product-recommendations', 'ai-recommendations'],
  [CacheTag.HOMEPAGE]: ['homepage', 'featured-products', 'platform-customization'],
  [CacheTag.MARKETPLACE]: [
    'marketplace-catalog',
    'marketplace-products',
    'marketplace-facets',
    'filtered-products',
    'product-search',
  ],
  [CacheTag.LEGAL]: ['legal-pages'],
  [CacheTag.FAQ]: ['faq'],
  [CacheTag.INSTITUTIONAL]: ['institutional-pages'],
  [CacheTag.ORDER]: ['orders', 'order'],
  [CacheTag.CART]: ['cart'],
  [CacheTag.NOTIFICATION]: ['notifications'],
  [CacheTag.MESSAGE]: ['messages', 'conversations'],
  [CacheTag.USER]: ['user', 'profile', 'current-user'],
  [CacheTag.ANALYTICS]: ['analytics', 'product-analytics'],
  [CacheTag.STATS]: ['dashboard-stats', 'product-stats', 'course-stats'],
  [CacheTag.SEO_META]: [],
  [CacheTag.SITEMAP]: ['sitemap'],
};

/** Clés React Query pour une entité spécifique */
export function queryKeysForEntity(
  tag: CacheTagValue,
  entityId?: string,
  context?: { storeId?: string }
): unknown[][] {
  const prefixes = TAG_TO_QUERY_PREFIXES[tag] ?? [];
  const keys: unknown[][] = prefixes.map(p => [p]);

  if (entityId) {
    keys.push([tag, entityId]);
    const detailPrefix = TAG_TO_QUERY_PREFIXES[tag]?.[0];
    if (detailPrefix) keys.push([detailPrefix, entityId]);
  }

  if (context?.storeId) {
    keys.push(['products', context.storeId]);
    keys.push(['stores', context.storeId]);
  }

  return keys;
}

/** Toutes les clés à invalider pour un ensemble de tags */
export function collectQueryKeysForTags(
  tags: CacheTagValue[],
  entityId?: string,
  context?: { storeId?: string }
): unknown[][] {
  const seen = new Set<string>();
  const result: unknown[][] = [];

  for (const tag of tags) {
    for (const key of queryKeysForEntity(tag, entityId, context)) {
      const serialized = JSON.stringify(key);
      if (!seen.has(serialized)) {
        seen.add(serialized);
        result.push(key);
      }
    }
  }

  return result;
}
