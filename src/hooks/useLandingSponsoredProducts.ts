import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchLandingSponsoredProducts } from '@/lib/sponsorship/fetch-landing-sponsored-products';

export const LANDING_SPONSORED_QUERY_KEY = ['landing-sponsored-products', 'v2'] as const;

const LANDING_SPONSORED_STALE_MS = 60_000;

export function prefetchLandingSponsoredProducts(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: LANDING_SPONSORED_QUERY_KEY,
    queryFn: fetchLandingSponsoredProducts,
    staleTime: LANDING_SPONSORED_STALE_MS,
  });
}

/** Prefetch dès le montage de la landing (avant le scroll vers la section). */
export function usePrefetchLandingSponsoredProducts() {
  const queryClient = useQueryClient();
  useEffect(() => {
    void prefetchLandingSponsoredProducts(queryClient);
  }, [queryClient]);
}

export function useLandingSponsoredProducts() {
  return useQuery({
    queryKey: LANDING_SPONSORED_QUERY_KEY,
    queryFn: fetchLandingSponsoredProducts,
    staleTime: LANDING_SPONSORED_STALE_MS,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attempt => Math.min(800 * 2 ** attempt, 4000),
  });
}
