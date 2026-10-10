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

/**
 * Prefetch après LCP : idle + window load, pour ne pas concurrencer le hero.
 * La section différée (rootMargin) déclenche aussi le fetch via useQuery.
 */
export function usePrefetchLandingSponsoredProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const warmChunk = () => {
      void import('@/components/landing/premium/SponsoredProductsSection');
    };

    const run = async () => {
      if (cancelled) return;
      try {
        await prefetchLandingSponsoredProducts(queryClient);
        if (cancelled) return;
        const cached = queryClient.getQueryData(LANDING_SPONSORED_QUERY_KEY) as
          | Awaited<ReturnType<typeof fetchLandingSponsoredProducts>>
          | undefined;
        if (cached?.length) {
          preloadLandingSponsoredImages(cached, 6);
        }
        warmChunk();
      } catch {
        // retry via useQuery au mount de la section
      }
    };

    const schedule = () => {
      if (cancelled) return;
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => void run(), { timeout: 4000 });
      } else {
        timeoutId = window.setTimeout(() => void run(), 1200);
      }
    };

    if (typeof document !== 'undefined' && document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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
