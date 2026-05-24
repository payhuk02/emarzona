import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateCatalogCaches } from '@/lib/cache-invalidation';

/**
 * Hook utilitaire pour invalider le cache catalogue après une mutation produit.
 */
export function useCatalogCacheInvalidation() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    invalidateCatalogCaches(queryClient);
  }, [queryClient]);
}
