/**
 * Prefetch intelligent : routes idle + hover, activé selon auth / rôle vendeur.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { usePrefetchRoutes, type PrefetchRoutesOptions } from '@/hooks/usePrefetchRoutes';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { prefetchProductWizardChunks } from '@/lib/wizard/prefetch-product-wizards';

export interface PrefetchOptions extends PrefetchRoutesOptions {
  /**
   * @deprecated Utiliser idleRoutes / hoverRoutes via getRoutePrefetchConfig
   */
  routes?: string[];
  queries?: Array<{
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
  }>;
  delay?: number;
  /** Commerce type actif — précharge les chunks wizard après idle */
  commerceType?: StoreCommerceType | null;
  prefetchWizardChunks?: boolean;
}

/**
 * Hook principal pour le prefetching (idle + hover + queries optionnelles).
 */
export const usePrefetch = (options: PrefetchOptions = {}) => {
  const hoverRoutes = options.hoverRoutes ?? (options.routes?.length ? options.routes : undefined);

  usePrefetchRoutes({
    enabled: options.enabled,
    idleRoutes: options.idleRoutes,
    hoverRoutes,
    idleDelayMs: options.idleDelayMs,
  });

  const queryClient = useQueryClient();
  const { queries = [] } = options;

  useEffect(() => {
    if (options.enabled === false || queries.length === 0) return;
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [queries, queryClient, options.enabled]);

  useEffect(() => {
    if (options.enabled === false || options.prefetchWizardChunks === false) return;
    const delayMs = options.idleDelayMs ?? 2500;
    const timer = window.setTimeout(() => {
      prefetchProductWizardChunks(options.commerceType);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [options.enabled, options.prefetchWizardChunks, options.commerceType, options.idleDelayMs]);
};

/**
 * Prefetch des données critiques au démarrage (utilisateur connecté).
 */
export const usePrefetchCriticalData = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    logger.debug('Prefetching critical data for user', { userId });
  }, [userId, queryClient]);
};
