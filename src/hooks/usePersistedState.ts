/**
 * Hook pour persister l'état dans localStorage
 * Alternative à useState qui sauvegarde automatiquement dans le cache
 */

import { useState, useEffect, useCallback } from 'react';
import { cache } from '@/lib/cache';

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  ttl?: number
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Récupérer la valeur du cache ou utiliser la valeur initiale
  const [state, setState] = useState<T>(() => {
    const cached = cache.get<T>(key);
    return cached !== null ? cached : initialValue;
  });

  // Sauvegarder dans le cache à chaque changement
  useEffect(() => {
    cache.set(key, state, ttl);
  }, [key, state, ttl]);

  // Fonction pour effacer la valeur
  const clearState = useCallback(() => {
    cache.remove(key);
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setState, clearState];
}

/**
 * Hook spécifique pour le panier
 */
export function useCart() {
  return usePersistedState<Array<{
    productId: string;
    quantity: number;
    price: number;
  }>>('cart', [], 24 * 60 * 60 * 1000); // 24 heures
}

/**
 * Hook spécifique pour les favoris
 */
export function useFavorites() {
  return usePersistedState<string[]>('favorites', [], 30 * 24 * 60 * 60 * 1000); // 30 jours
}

/**
 * Hook pour les recherches récentes
 */
export function useRecentSearches(maxItems: number = 10) {
  const [searches, setSearches, clearSearches] = usePersistedState<string[]>(
    'recent_searches',
    [],
    7 * 24 * 60 * 60 * 1000 // 7 jours
  );

  const addSearch = useCallback((search: string) => {
    setSearches((prev) => {
      // Supprimer les doublons
      const filtered = prev.filter((s) => s !== search);
      // Ajouter en premier et limiter le nombre
      return [search, ...filtered].slice(0, maxItems);
    });
  }, [maxItems, setSearches]);

  return { searches, addSearch, clearSearches };
}

/**
 * Hook pour les filtres récents
 */
export function useRecentFilters() {
  return usePersistedState<Record<string, any>>(
    'recent_filters',
    {},
    24 * 60 * 60 * 1000 // 24 heures
  );
}

