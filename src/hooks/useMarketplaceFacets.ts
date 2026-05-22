import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { FilterState } from '@/types/marketplace';
import type { MarketplaceFacetsResponse } from '@/types/marketplace-facets';
import {
  cacheMarketplaceFacets,
  getCachedMarketplaceFacetsSync,
  MARKETPLACE_CACHE_SOFT_STALE_MS,
} from '@/lib/marketplace-cache';

interface UseMarketplaceFacetsParams {
  filters: FilterState;
  searchQuery: string;
  enabled?: boolean;
}

function normalizeFacets(data: unknown): MarketplaceFacetsResponse {
  const raw = (data || {}) as Record<string, unknown>;
  const mapBuckets = (arr: unknown): MarketplaceFacetsResponse['product_types'] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(item => {
        const row = item as Record<string, unknown>;
        return {
          value: String(row.value ?? ''),
          count: Number(row.count ?? 0),
        };
      })
      .filter(b => b.value && b.count > 0);
  };

  return {
    total: Number(raw.total ?? 0),
    product_types: mapBuckets(raw.product_types),
    categories: mapBuckets(raw.categories),
  };
}

export function useMarketplaceFacets({
  filters,
  searchQuery,
  enabled = true,
}: UseMarketplaceFacetsParams) {
  const facetCacheParams = useMemo(
    () => ({
      productType: filters.productType,
      category: filters.category,
      search: searchQuery.trim(),
      featuredOnly: filters.featuredOnly,
    }),
    [filters.productType, filters.category, searchQuery, filters.featuredOnly]
  );

  const cachedFacets = useMemo(
    () => (enabled ? getCachedMarketplaceFacetsSync(facetCacheParams) : null),
    [enabled, facetCacheParams]
  );

  return useQuery({
    queryKey: [
      'marketplace-facets',
      filters.productType,
      filters.category,
      searchQuery.trim(),
      filters.featuredOnly,
    ],
    queryFn: async (): Promise<MarketplaceFacetsResponse> => {
      const { data, error } = await supabase.rpc('get_marketplace_facets', {
        p_product_type: filters.productType !== 'all' ? filters.productType : null,
        p_category: filters.category !== 'all' ? filters.category : null,
        p_search_query: searchQuery.trim() || null,
        p_featured_only: filters.featuredOnly || filters.category === 'featured',
      });

      if (error) {
        logger.error('[useMarketplaceFacets] RPC error:', error);
        throw error;
      }

      const facets = normalizeFacets(data);
      cacheMarketplaceFacets(facetCacheParams, facets).catch(err =>
        logger.warn('[useMarketplaceFacets] cache write failed', err)
      );
      return facets;
    },
    enabled,
    initialData: cachedFacets?.data,
    initialDataUpdatedAt: cachedFacets?.fetchedAt,
    staleTime: MARKETPLACE_CACHE_SOFT_STALE_MS,
    gcTime: 5 * 60 * 1000,
  });
}

/** Compte pour un type donné (0 si absent). */
export function getFacetCount(
  buckets: MarketplaceFacetsResponse['product_types'],
  value: string
): number | undefined {
  const hit = buckets.find(b => b.value === value);
  return hit?.count;
}
