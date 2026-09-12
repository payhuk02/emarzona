import { useQuery } from '@tanstack/react-query';
import { fetchLandingSponsoredProducts } from '@/lib/sponsorship/fetch-landing-sponsored-products';

export function useLandingSponsoredProducts() {
  return useQuery({
    queryKey: ['landing-sponsored-products'],
    queryFn: fetchLandingSponsoredProducts,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
