/**
 * Clear dashboard product-edit React Query caches after a successful save.
 * Catalog invalidation alone does not touch these keys — without this, reopening
 * edit within staleTime (5 min) rehydrates the pre-save gallery (old image).
 */
import type { QueryClient } from '@tanstack/react-query';

export const PRODUCT_EDIT_QUERY_PREFIXES = [
  'digital-product-edit',
  'physical-product-edit',
  'service-product-edit',
  'course-product-edit',
  'artist-product-edit',
  'artist-product', // useArtistProduct query key
] as const;

export type ProductEditQueryPrefix = (typeof PRODUCT_EDIT_QUERY_PREFIXES)[number];

export function invalidateProductEditCache(
  queryClient: QueryClient,
  productId: string,
  prefixes: ProductEditQueryPrefix | ProductEditQueryPrefix[] = [...PRODUCT_EDIT_QUERY_PREFIXES]
): void {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const prefix of list) {
    // removeQueries: next edit mount must refetch, not reuse stale convertToFormData
    void queryClient.removeQueries({ queryKey: [prefix, productId] });
  }
}
