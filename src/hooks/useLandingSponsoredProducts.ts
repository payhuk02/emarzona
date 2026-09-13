import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  fetchLandingSponsoredProducts,
  preloadLandingSponsoredImages,
} from '@/lib/sponsorship/fetch-landing-sponsored-products';

export const LANDING_SPONSORED_QUERY_KEY = ['landing-sponsored-products', 'v2'] as const;

const LANDING_SPONSORED_STALE_MS = 60_000;

export function prefetchLandingSponsoredProducts(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: LANDING_SPONSORED_QUERY_KEY,
    queryFn: fetchLandingSponsoredProducts,
    staleTime: LANDING_SPONSORED_STALE_MS,
  });
}

/** Prefetch données + chunk JS + images dès le montage landing. */
export function usePrefetchLandingSponsoredProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const warmChunk = () => {
      void import('@/components/landing/premium/SponsoredProductsSection');
    };

    const run = async () => {
      try {
        await prefetchLandingSponsoredProducts(queryClient);
        if (cancelled) return;
        const cached = queryClient.getQueryData(LANDING_SPONSORED_QUERY_KEY) as
          | Awaited<ReturnType<typeof fetchLandingSponsoredProducts>>
          | undefined;
        if (cached?.length) {
          preloadLandingSponsoredImages(cached, 9);
        }
      } catch {
        // retry via useQuery au mount de la section
      }
    };

    void run();

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmChunk, { timeout: 1800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(warmChunk, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
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
    placeholderData: previous => previous,
  });
}
