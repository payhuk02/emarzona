/**
 * Hook catalogue unifié — 1 requête React Query, 2 RPC parallèles (products + facets).
 * Réduit la complexité cache et garantit cohérence produits/facettes.
 */

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FilterState, PaginationState, Product } from '@/types/marketplace';
import type { MarketplaceFacetsResponse } from '@/types/marketplace-facets';
import { cacheStrategies } from '@/lib/cache-optimization';
import {
  cacheMarketplaceProducts,
  cacheMarketplaceFacets,
  getCachedMarketplaceProductsSync,
  getCachedMarketplaceFacetsSync,
  MARKETPLACE_CACHE_SOFT_STALE_MS,
} from '@/lib/marketplace-cache';
import { fetchMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { fetchMarketplaceFacetsData } from '@/hooks/useMarketplaceFacets';

export interface MarketplaceCatalogParams {
  filters: FilterState;
  pagination: PaginationState;
  searchQuery: string;
  hasSearchQuery: boolean;
  shouldUseRPCFiltering: boolean;
  enabled?: boolean;
}

export interface MarketplaceCatalogData {
  products: Product[];
  totalCount: number;
  filteredCount: number;
  facets: MarketplaceFacetsResponse;
}

function buildCatalogQueryKey(
  stableFiltersKey: string,
  page: number,
  itemsPerPage: number,
  searchQuery: string
) {
  return ['marketplace-catalog', stableFiltersKey, page, itemsPerPage, searchQuery.trim()] as const;
}

export function useMarketplaceCatalog({
  filters,
  pagination,
  searchQuery,
  hasSearchQuery,
  shouldUseRPCFiltering,
  enabled = true,
}: MarketplaceCatalogParams) {
  const queryClient = useQueryClient();

  const stableFiltersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const cacheFilterParams = useMemo(
    () => ({
      ...filters,
      page: pagination.currentPage,
      itemsPerPage: pagination.itemsPerPage,
    }),
    [filters, pagination.currentPage, pagination.itemsPerPage]
  );

  const facetCacheParams = useMemo(
    () => ({
      productType: filters.productType,
      category: filters.category,
      search: searchQuery.trim(),
      featuredOnly: filters.featuredOnly,
    }),
    [filters.productType, filters.category, searchQuery, filters.featuredOnly]
  );

  const cachedProducts = useMemo(
    () => (enabled && !hasSearchQuery ? getCachedMarketplaceProductsSync(cacheFilterParams) : null),
    [enabled, hasSearchQuery, cacheFilterParams]
  );

  const cachedFacets = useMemo(
    () => (enabled ? getCachedMarketplaceFacetsSync(facetCacheParams) : null),
    [enabled, facetCacheParams]
  );

  const initialData = useMemo((): MarketplaceCatalogData | undefined => {
    if (!cachedProducts && !cachedFacets) return undefined;
    return {
      products: cachedProducts?.data.products ?? [],
      totalCount: cachedProducts?.data.totalCount ?? cachedFacets?.data.total ?? 0,
      filteredCount: cachedProducts?.data.products.length ?? 0,
      facets: cachedFacets?.data ?? { total: 0, product_types: [], categories: [] },
    };
  }, [cachedProducts, cachedFacets]);

  const queryKey = buildCatalogQueryKey(
    stableFiltersKey,
    pagination.currentPage,
    pagination.itemsPerPage,
    searchQuery
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MarketplaceCatalogData> => {
      const [productsResult, facets] = await Promise.all([
        fetchMarketplaceProducts({
          filters,
          pagination,
          hasSearchQuery,
          shouldUseRPCFiltering,
        }),
        fetchMarketplaceFacetsData(filters, searchQuery),
      ]);

      if (!hasSearchQuery) {
        void cacheMarketplaceProducts(cacheFilterParams, {
          products: productsResult.products,
          totalCount: productsResult.totalCount,
        });
      }
      void cacheMarketplaceFacets(facetCacheParams, facets);

      return {
        products: productsResult.products,
        totalCount: productsResult.totalCount,
        filteredCount: productsResult.filteredCount,
        facets,
      };
    },
    enabled: enabled && !hasSearchQuery,
    initialData,
    initialDataUpdatedAt:
      Math.max(cachedProducts?.fetchedAt ?? 0, cachedFacets?.fetchedAt ?? 0) || undefined,
    staleTime: MARKETPLACE_CACHE_SOFT_STALE_MS,
    gcTime: cacheStrategies.products.gcTime,
    refetchOnWindowFocus: cacheStrategies.products.refetchOnWindowFocus,
    placeholderData: previous => previous,
    structuralSharing: true,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const prefetchPage = (page: number) => {
    queryClient.prefetchQuery({
      queryKey: buildCatalogQueryKey(stableFiltersKey, page, pagination.itemsPerPage, searchQuery),
      queryFn: async () => {
        const [productsResult, facets] = await Promise.all([
          fetchMarketplaceProducts({
            filters,
            pagination: { ...pagination, currentPage: page },
            hasSearchQuery,
            shouldUseRPCFiltering,
          }),
          fetchMarketplaceFacetsData(filters, searchQuery),
        ]);
        return {
          products: productsResult.products,
          totalCount: productsResult.totalCount,
          filteredCount: productsResult.filteredCount,
          facets,
        };
      },
      staleTime: MARKETPLACE_CACHE_SOFT_STALE_MS,
    });
  };

  const prefetchNextPage = () => {
    if (
      query.data &&
      pagination.currentPage < Math.ceil(query.data.totalCount / pagination.itemsPerPage)
    ) {
      prefetchPage(pagination.currentPage + 1);
    }
  };

  return {
    products: query.data?.products ?? [],
    totalCount: query.data?.totalCount ?? 0,
    filteredCount: query.data?.filteredCount ?? 0,
    facets: query.data?.facets,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    prefetchNextPage,
    prefetchPreviousPage: () => {
      if (query.data && pagination.currentPage > 1) prefetchPage(pagination.currentPage - 1);
    },
  };
}
