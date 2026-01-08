/**
 * Hook pour gérer la pagination du marketplace
 * Centralise la logique de pagination pour améliorer la maintenabilité
 */

import { useState, useCallback, useMemo } from 'react';
import { PaginationState } from '@/types/marketplace';
import { logger } from '@/lib/logger';

const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  itemsPerPage: 12,
  totalItems: 0,
};

/**
 * Hook pour gérer la pagination du marketplace
 * 
 * @param initialItemsPerPage - Nombre d'éléments par page (défaut: 12)
 * @returns Objet contenant l'état de pagination et les fonctions de navigation
 */
export function useMarketplacePagination(initialItemsPerPage: number = 12) {
  const [pagination, setPagination] = useState<PaginationState>({
    ...DEFAULT_PAGINATION,
    itemsPerPage: initialItemsPerPage,
  });

  /**
   * Calcule le nombre total de pages
   */
  const totalPages = useMemo(
    () => Math.ceil(pagination.totalItems / pagination.itemsPerPage),
    [pagination.totalItems, pagination.itemsPerPage]
  );

  /**
   * Vérifie si on peut aller à la page précédente
   */
  const canGoPrevious = useMemo(
    () => pagination.currentPage > 1,
    [pagination.currentPage]
  );

  /**
   * Vérifie si on peut aller à la page suivante
   */
  const canGoNext = useMemo(
    () => pagination.currentPage < totalPages,
    [pagination.currentPage, totalPages]
  );

  /**
   * Va à une page spécifique
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) {
        logger.warn('[useMarketplacePagination] Invalid page number:', { page, totalPages });
        return;
      }
      logger.debug('[useMarketplacePagination] Navigating to page:', { page, totalPages });
      setPagination(prev => ({ ...prev, currentPage: page }));
    },
    [totalPages]
  );

  /**
   * Va à la page précédente
   */
  const goToPreviousPage = useCallback(() => {
    if (canGoPrevious) {
      goToPage(pagination.currentPage - 1);
    }
  }, [canGoPrevious, pagination.currentPage, goToPage]);

  /**
   * Va à la page suivante
   */
  const goToNextPage = useCallback(() => {
    if (canGoNext) {
      goToPage(pagination.currentPage + 1);
    }
  }, [canGoNext, pagination.currentPage, goToPage]);

  /**
   * Réinitialise la pagination à la page 1
   */
  const resetPagination = useCallback(() => {
    logger.debug('[useMarketplacePagination] Resetting to page 1');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  /**
   * Met à jour le nombre total d'éléments
   */
  const updateTotalItems = useCallback((total: number) => {
    setPagination(prev => ({ ...prev, totalItems: total }));
  }, []);

  /**
   * Calcule les indices de pagination pour les requêtes Supabase
   */
  const paginationRange = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage - 1;
    return { startIndex, endIndex };
  }, [pagination.currentPage, pagination.itemsPerPage]);

  return {
    pagination,
    setPagination,
    totalPages,
    canGoPrevious,
    canGoNext,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    resetPagination,
    updateTotalItems,
    paginationRange,
  };
}
