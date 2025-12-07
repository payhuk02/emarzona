/**
 * Hook useSort - Gestion simplifiée du tri
 * Fournit une API simple pour gérer le tri de tableaux
 * 
 * @example
 * ```tsx
 * const { sortedItems, sortBy, sortOrder, handleSort } = useSort(items, {
 *   defaultSortBy: 'name',
 *   defaultSortOrder: 'asc',
 * });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface UseSortOptions<T> {
  /**
   * Colonne de tri par défaut
   */
  defaultSortBy?: keyof T | string;
  /**
   * Ordre de tri par défaut
   * @default 'asc'
   */
  defaultSortOrder?: SortOrder;
  /**
   * Fonction de comparaison personnalisée
   */
  compareFn?: (a: T, b: T, sortBy: keyof T | string, sortOrder: SortOrder) => number;
}

export interface UseSortReturn<T> {
  /**
   * Éléments triés
   */
  sortedItems: T[];
  /**
   * Colonne de tri actuelle
   */
  sortBy: keyof T | string | null;
  /**
   * Ordre de tri actuel
   */
  sortOrder: SortOrder;
  /**
   * Changer le tri
   */
  handleSort: (column: keyof T | string) => void;
  /**
   * Définir le tri manuellement
   */
  setSort: (column: keyof T | string, order: SortOrder) => void;
  /**
   * Réinitialiser le tri
   */
  resetSort: () => void;
}

/**
 * Fonction de comparaison par défaut
 */
function defaultCompare<T>(
  a: T,
  b: T,
  sortBy: keyof T | string,
  sortOrder: SortOrder
): number {
  const aValue = (a as any)[sortBy];
  const bValue = (b as any)[sortBy];

  // Gérer les valeurs null/undefined
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
  if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

  // Comparer les valeurs
  let comparison = 0;
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    comparison = aValue.localeCompare(bValue);
  } else if (typeof aValue === 'number' && typeof bValue === 'number') {
    comparison = aValue - bValue;
  } else if (aValue instanceof Date && bValue instanceof Date) {
    comparison = aValue.getTime() - bValue.getTime();
  } else {
    comparison = String(aValue).localeCompare(String(bValue));
  }

  return sortOrder === 'asc' ? comparison : -comparison;
}

/**
 * Hook pour gérer le tri d'une liste
 */
export function useSort<T>(
  items: T[],
  options: UseSortOptions<T> = {}
): UseSortReturn<T> {
  const {
    defaultSortBy,
    defaultSortOrder = 'asc',
    compareFn = defaultCompare,
  } = options;

  const [sortBy, setSortBy] = useState<keyof T | string | null>(defaultSortBy || null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  const sortedItems = useMemo(() => {
    if (!sortBy || items.length === 0) return items;

    const sorted = [...items];
    sorted.sort((a, b) => compareFn(a, b, sortBy, sortOrder));
    return sorted;
  }, [items, sortBy, sortOrder, compareFn]);

  const handleSort = useCallback(
    (column: keyof T | string) => {
      if (sortBy === column) {
        // Inverser l'ordre si on clique sur la même colonne
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // Nouvelle colonne, trier par ordre croissant
        setSortBy(column);
        setSortOrder('asc');
      }
    },
    [sortBy]
  );

  const setSort = useCallback((column: keyof T | string, order: SortOrder) => {
    setSortBy(column);
    setSortOrder(order);
  }, []);

  const resetSort = useCallback(() => {
    setSortBy(defaultSortBy || null);
    setSortOrder(defaultSortOrder);
  }, [defaultSortBy, defaultSortOrder]);

  return {
    sortedItems,
    sortBy,
    sortOrder,
    handleSort,
    setSort,
    resetSort,
  };
}

