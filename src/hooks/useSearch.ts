/**
 * Hook useSearch - Gestion simplifiée de la recherche
 * Fournit une API simple pour gérer la recherche avec debounce
 * 
 * @example
 * ```tsx
 * const { query, results, isSearching, clearSearch } = useSearch(items, {
 *   searchKeys: ['name', 'description'],
 *   debounceMs: 300,
 * });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface UseSearchOptions<T> {
  /**
   * Clés à rechercher dans les objets
   */
  searchKeys?: (keyof T)[];
  /**
   * Délai de debounce en millisecondes
   * @default 300
   */
  debounceMs?: number;
  /**
   * Fonction de recherche personnalisée
   */
  searchFn?: (item: T, query: string) => boolean;
  /**
   * Valeur de recherche initiale
   */
  initialQuery?: string;
  /**
   * Activer la recherche insensible à la casse
   * @default true
   */
  caseSensitive?: boolean;
}

export interface UseSearchReturn<T> {
  /**
   * Requête de recherche actuelle
   */
  query: string;
  /**
   * Requête debounced
   */
  debouncedQuery: string;
  /**
   * Résultats de recherche
   */
  results: T[];
  /**
   * Indique si une recherche est en cours
   */
  isSearching: boolean;
  /**
   * Définir la requête de recherche
   */
  setQuery: (query: string) => void;
  /**
   * Effacer la recherche
   */
  clearSearch: () => void;
  /**
   * Nombre de résultats
   */
  resultCount: number;
}

/**
 * Hook pour rechercher dans une liste
 */
export function useSearch<T>(
  items: T[],
  options: UseSearchOptions<T> = {}
): UseSearchReturn<T> {
  const {
    searchKeys = [],
    debounceMs = 300,
    searchFn,
    initialQuery = '',
    caseSensitive = false,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, debounceMs);

  const isSearching = query !== debouncedQuery;

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const searchTerm = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();

    return items.filter((item) => {
      if (searchFn) {
        return searchFn(item, debouncedQuery);
      }

      // Recherche par défaut sur les clés spécifiées
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const value = (item as any)[key];
          if (value == null) return false;

          const stringValue = String(value);
          const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();

          return searchValue.includes(searchTerm);
        });
      }

      // Si aucune clé spécifiée, rechercher dans toutes les valeurs de l'objet
      return Object.values(item).some((value) => {
        if (value == null) return false;
        const stringValue = String(value);
        const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();
        return searchValue.includes(searchTerm);
      });
    });
  }, [items, debouncedQuery, searchKeys, searchFn, caseSensitive]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const resultCount = results.length;

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    setQuery,
    clearSearch,
    resultCount,
  };
}

