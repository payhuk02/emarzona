/**
 * Hook usePagination - Gestion réutilisable de la pagination
 * Simplifie la gestion de la pagination dans les composants
 *
 * @example
 * ```tsx
 * const {
 *   page,
 *   pageSize,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 *   setPageSize,
 * } = usePagination({
 *   total: 100,
 *   initialPage: 1,
 *   initialPageSize: 10,
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface UsePaginationOptions {
  /**
   * Nombre total d'éléments
   */
  total: number;
  /**
   * Page initiale
   * @default 1
   */
  initialPage?: number;
  /**
   * Taille de page initiale
   * @default 10
   */
  initialPageSize?: number;
  /**
   * Tailles de page disponibles
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * Callback appelé quand la page change
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback appelé quand la taille de page change
   */
  onPageSizeChange?: (pageSize: number) => void;
}

export interface UsePaginationReturn {
  /**
   * Page actuelle (1-indexed)
   */
  page: number;
  /**
   * Taille de page actuelle
   */
  pageSize: number;
  /**
   * Nombre total de pages
   */
  totalPages: number;
  /**
   * Indique s'il y a une page suivante
   */
  hasNextPage: boolean;
  /**
   * Indique s'il y a une page précédente
   */
  hasPreviousPage: boolean;
  /**
   * Aller à une page spécifique
   */
  goToPage: (page: number) => void;
  /**
   * Aller à la page suivante
   */
  nextPage: () => void;
  /**
   * Aller à la page précédente
   */
  previousPage: () => void;
  /**
   * Aller à la première page
   */
  goToFirstPage: () => void;
  /**
   * Aller à la dernière page
   */
  goToLastPage: () => void;
  /**
   * Changer la taille de page
   */
  setPageSize: (pageSize: number) => void;
  /**
   * Réinitialiser la pagination
   */
  reset: () => void;
  /**
   * Indices de début et fin pour l'affichage
   */
  range: {
    start: number;
    end: number;
  };
}

/**
 * Hook pour gérer la pagination
 */
export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const {
    total,
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Vérifier s'il y a une page suivante/précédente
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPreviousPage = useMemo(() => page > 1, [page]);

  // Calculer la plage d'affichage
  const range = useMemo(() => {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return { start, end };
  }, [page, pageSize, total]);

  // Aller à une page spécifique
  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      if (validPage !== page) {
        setPage(validPage);
        onPageChange?.(validPage);
      }
    },
    [page, totalPages, onPageChange]
  );

  // Aller à la page suivante
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  }, [hasNextPage, page, goToPage]);

  // Aller à la page précédente
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(page - 1);
    }
  }, [hasPreviousPage, page, goToPage]);

  // Aller à la première page
  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // Aller à la dernière page
  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // Changer la taille de page
  const setPageSize = useCallback(
    (newPageSize: number) => {
      if (!pageSizeOptions.includes(newPageSize)) {
        // ✅ PHASE 2: Remplacer console.warn par logger
        logger.warn(`Page size ${newPageSize} is not in available options`, {
          newPageSize,
          pageSizeOptions,
        });
        return;
      }

      // Ajuster la page actuelle si nécessaire
      const newTotalPages = Math.ceil(total / newPageSize);
      const newPage = Math.min(page, newTotalPages);

      setPageSizeState(newPageSize);
      setPage(newPage);
      onPageSizeChange?.(newPageSize);
      onPageChange?.(newPage);
    },
    [pageSizeOptions, total, page, onPageSizeChange, onPageChange]
  );

  // Réinitialiser
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    reset,
    range,
  };
}

/**
 * Hook pour la pagination avec infinite scroll
 */
export function useInfinitePagination<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options: {
    initialPageSize?: number;
    enabled?: boolean;
  } = {}
) {
  const { initialPageSize = 20, enabled = true } = options;
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchPage(page, initialPageSize);
      setAllData(prev => [...prev, ...result.data]);
      setTotal(result.total);
      setHasMore(
        result.data.length === initialPageSize && allData.length + result.data.length < result.total
      );
      setPage(prev => prev + 1);
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.error par logger
      logger.error('Error loading more', { error });
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isLoading, hasMore, page, initialPageSize, fetchPage, allData.length]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setTotal(0);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    total,
    isLoading,
    hasMore,
    loadMore,
    reset,
  };
}
