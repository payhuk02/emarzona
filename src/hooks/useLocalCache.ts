/**
 * Hook useLocalCache - Gestion simplifiée du cache local
 * Fournit une API simple pour gérer le cache avec TTL
 *
 * @example
 * ```tsx
 * const { get, set, remove, clear } = useLocalCache('my-key', 60000);
 *
 * const data = get();
 * set(data);
 * ```
 */

import { useCallback } from 'react';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface UseLocalCacheOptions {
  /**
   * Time to live en millisecondes
   * @default 5 minutes
   */
  ttl?: number;
  /**
   * Utiliser sessionStorage au lieu de localStorage
   * @default false
   */
  useSessionStorage?: boolean;
}

export interface UseLocalCacheReturn<T> {
  /**
   * Obtenir la valeur du cache
   */
  get: () => T | null;
  /**
   * Définir une valeur dans le cache
   */
  set: (value: T, customTtl?: number) => void;
  /**
   * Supprimer la valeur du cache
   */
  remove: () => void;
  /**
   * Vérifier si la clé existe dans le cache
   */
  has: () => boolean;
  /**
   * Réinitialiser le cache
   */
  clear: () => void;
  /**
   * Obtenir la valeur ou exécuter une fonction et mettre en cache le résultat
   */
  getOrSet: (fn: () => Promise<T> | T, customTtl?: number) => Promise<T>;
}

/**
 * Hook pour gérer le cache local
 */
export function useLocalCache<T>(
  key: string,
  options: UseLocalCacheOptions = {}
): UseLocalCacheReturn<T> {
  const { ttl = 5 * 60 * 1000, useSessionStorage = false } = options;
  const storage = useSessionStorage ? sessionStorage : localStorage;
  const ttlKey = `${key}_ttl`;

  const get = useCallback((): T | null => {
    try {
      const cached = storage.getItem(key);
      const cachedTtl = storage.getItem(ttlKey);

      if (!cached || !cachedTtl) {
        return null;
      }

      const ttlValue = Number(cachedTtl);
      if (Date.now() > ttlValue) {
        // Expiré, supprimer
        storage.removeItem(key);
        storage.removeItem(ttlKey);
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.error par logger
      logger.error(`Error getting cache for key "${key}"`, { error, key });
      return null;
    }
  }, [key, ttlKey, storage]);

  const set = useCallback(
    (value: T, customTtl?: number) => {
      try {
        const ttlValue = customTtl ?? ttl;
        const expiry = Date.now() + ttlValue;

        storage.setItem(key, JSON.stringify(value));
        storage.setItem(ttlKey, String(expiry));
      } catch (error) {
        // ✅ PHASE 2: Remplacer console.error par logger
        logger.error(`Error setting cache for key "${key}"`, { error, key });
      }
    },
    [key, ttlKey, ttl, storage]
  );

  const remove = useCallback(() => {
    try {
      storage.removeItem(key);
      storage.removeItem(ttlKey);
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.error par logger
      logger.error(`Error removing cache for key "${key}"`, { error, key });
    }
  }, [key, ttlKey, storage]);

  const has = useCallback((): boolean => {
    try {
      const cached = storage.getItem(key);
      const cachedTtl = storage.getItem(ttlKey);

      if (!cached || !cachedTtl) {
        return false;
      }

      const ttlValue = Number(cachedTtl);
      if (Date.now() > ttlValue) {
        // Expiré, supprimer
        storage.removeItem(key);
        storage.removeItem(ttlKey);
        return false;
      }

      return true;
    } catch (_error) {
      return false;
    }
  }, [key, ttlKey, storage]);

  const clear = useCallback(() => {
    remove();
  }, [remove]);

  const getOrSet = useCallback(
    async (fn: () => Promise<T> | T, customTtl?: number): Promise<T> => {
      const cached = get();
      if (cached !== null) {
        return cached;
      }

      const value = await fn();
      set(value, customTtl);
      return value;
    },
    [get, set]
  );

  return {
    get,
    set,
    remove,
    has,
    clear,
    getOrSet,
  };
}






