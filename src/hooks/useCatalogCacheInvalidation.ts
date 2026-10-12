import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateCatalogCaches } from '@/lib/cache-invalidation';
import {
  invalidateProductEditCache,
  type ProductEditQueryPrefix,
} from '@/lib/products/invalidate-product-edit-cache';

/**
 * Hook utilitaire pour invalider le cache catalogue après une mutation produit.
 */
export function useCatalogCacheInvalidation() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    invalidateCatalogCaches(queryClient);
  }, [queryClient]);
}

/**
 * After product edit save: drop dashboard edit-form caches so reopen does not
 * revive the pre-save gallery (images / image_url) from a 5‑minute stale query.
 */
export function useProductEditCacheInvalidation() {
  const queryClient = useQueryClient();

  return useCallback(
    (productId: string, prefix?: ProductEditQueryPrefix | ProductEditQueryPrefix[]) => {
      invalidateProductEditCache(queryClient, productId, prefix);
    },
    [queryClient]
  );
}
