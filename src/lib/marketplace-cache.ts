/**
 * Système de cache local pour le marketplace
 * Utilise localStorage pour la persistance et IndexedDB pour les grandes données
 */

import { Product } from '@/types/marketplace';
import { logger } from '@/lib/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'marketplace_';
const CACHE_VERSION = '1.0.0';
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Génère une clé de cache stable basée sur les filtres
 * 
 * @param prefix - Préfixe pour la clé de cache (ex: 'products', 'categories')
 * @param params - Objet contenant les paramètres de filtrage
 * @returns Clé de cache unique et stable basée sur les paramètres
 * 
 * @example
 * ```ts
 * const key = generateCacheKey('products', { category: 'electronics', page: 1 });
 * // Résultat: 'marketplace_products_1.0.0_{"category":"electronics","page":1}'
 * ```
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const stableParams = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>)
  );
  return `${CACHE_PREFIX}${prefix}_${CACHE_VERSION}_${stableParams}`;
}

/**
 * Vérifie si IndexedDB est disponible
 */
function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Stocke les données dans le cache (localStorage pour petites données, IndexedDB pour grandes)
 * 
 * @param key - Clé unique pour identifier l'entrée de cache
 * @param data - Données à mettre en cache (seront sérialisées en JSON)
 * @param ttl - Durée de vie en millisecondes (défaut: 10 minutes)
 * @returns Promise qui se résout une fois les données mises en cache
 * 
 * @example
 * ```ts
 * await setCache('products_list', products, 5 * 60 * 1000); // Cache pour 5 minutes
 * ```
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  if (typeof window === 'undefined') return;

  const  entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };

  try {
    // Pour les petites données (< 5MB), utiliser localStorage
    const serialized = JSON.stringify(entry);
    if (serialized.length < 5 * 1024 * 1024) {
      localStorage.setItem(key, serialized);
    } else if (isIndexedDBAvailable()) {
      // Pour les grandes données, utiliser IndexedDB
      await setIndexedDBCache(key, entry);
    }
  } catch (error) {
    // Si localStorage est plein, essayer IndexedDB
    if (error instanceof DOMException && error.code === 22 && isIndexedDBAvailable()) {
      try {
        await setIndexedDBCache(key, entry);
      } catch (indexedDBError) {
        logger.warn('Failed to cache data in IndexedDB', { error: indexedDBError, key });
      }
    } else {
      logger.warn('Failed to cache data', { error, key });
    }
  }
}

/**
 * Récupère les données du cache
 * 
 * @param key - Clé unique de l'entrée de cache à récupérer
 * @returns Promise qui se résout avec les données en cache ou null si non trouvé/expiré
 * 
 * @example
 * ```ts
 * const cachedProducts = await getCache<Product[]>('products_list');
 * if (cachedProducts) {
 *   // Utiliser les données en cache
 * }
 * ```
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Essayer localStorage d'abord
    const cached = localStorage.getItem(key);
    if (cached) {
      const  entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() < entry.expiresAt) {
        return entry.data;
      } else {
        // Cache expiré, supprimer
        localStorage.removeItem(key);
      }
    }

    // Essayer IndexedDB si disponible
    if (isIndexedDBAvailable()) {
      const indexedEntry = await getIndexedDBCache<T>(key);
      if (indexedEntry && Date.now() < indexedEntry.expiresAt) {
        return indexedEntry.data;
      }
    }
  } catch (error) {
    logger.warn('Failed to get cache', { error, key });
  }

  return null;
}

/**
 * Supprime une entrée du cache
 * 
 * @param key - Clé unique de l'entrée de cache à supprimer
 * 
 * @example
 * ```ts
 * removeCache('products_list'); // Supprime le cache des produits
 * ```
 */
export function removeCache(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
    if (isIndexedDBAvailable()) {
      removeIndexedDBCache(key);
    }
  } catch (error) {
    logger.warn('Failed to remove cache', { error, key });
  }
}

/**
 * Nettoie le cache expiré
 * Parcourt toutes les entrées de cache et supprime celles qui ont expiré
 * 
 * @example
 * ```ts
 * // Appeler périodiquement pour nettoyer le cache
 * setInterval(cleanExpiredCache, 60 * 60 * 1000); // Toutes les heures
 * ```
 */
export function cleanExpiredCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const  entry: CacheEntry<unknown> = JSON.parse(cached);
            if (now >= entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }
  } catch (error) {
    logger.warn('Failed to clean cache', { error });
  }
}

/**
 * IndexedDB helpers
 */
let  db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('marketplace_cache', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('cache')) {
        database.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Stocke une entrée dans IndexedDB
 * 
 * @param key - Clé unique pour l'entrée
 * @param entry - Données à stocker avec timestamp et expiration
 */
async function setIndexedDBCache<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readwrite');
    const store = transaction.objectStore('cache');
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, ...entry });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Failed to set IndexedDB cache', { error, key });
  }
}

/**
 * Récupère une entrée depuis IndexedDB
 * 
 * @param key - Clé unique de l'entrée à récupérer
 * @returns Promise qui se résout avec l'entrée ou null si non trouvée
 */
async function getIndexedDBCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const database = await openDB();
    const transaction = database.transaction('cache', 'readonly');
    const store = transaction.objectStore('cache');
    return new Promise<CacheEntry<T> | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { key: _, ...entry } = result;
          resolve(entry as CacheEntry<T>);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Failed to get IndexedDB cache', { error, key });
    return null;
  }
}

/**
 * Supprime une entrée du cache IndexedDB
 * 
 * @param key - Clé unique de l'entrée à supprimer
 */
function removeIndexedDBCache(key: string): void {
  openDB()
    .then((database) => {
      const transaction = database.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    })
    .catch((error) => {
      logger.warn('Failed to remove IndexedDB cache', { error, key });
    });
}

/**
 * Cache spécifique pour les produits du marketplace
 */
export async function cacheMarketplaceProducts(
  filters: Record<string, unknown>,
  products: Product[],
  ttl: number = DEFAULT_TTL
): Promise<void> {
  const key = generateCacheKey('products', filters);
  await setCache(key, products, ttl);
}

export async function getCachedMarketplaceProducts(
  filters: Record<string, unknown>
): Promise<Product[] | null> {
  const key = generateCacheKey('products', filters);
  return await getCache<Product[]>(key);
}

/**
 * Nettoie le cache au démarrage de l'application
 */
if (typeof window !== 'undefined') {
  cleanExpiredCache();
  // Nettoyer le cache toutes les 5 minutes
  setInterval(cleanExpiredCache, 5 * 60 * 1000);
}







