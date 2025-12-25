/**
 * Système de cache local pour le marketplace
 * Utilise localStorage pour la persistance et IndexedDB pour les grandes données
 */

import { Product } from '@/types/marketplace';

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
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  if (typeof window === 'undefined') return;

  const entry: CacheEntry<T> = {
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
        console.warn('Failed to cache data:', indexedDBError);
      }
    } else {
      console.warn('Failed to cache data:', error);
    }
  }
}

/**
 * Récupère les données du cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Essayer localStorage d'abord
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
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
    console.warn('Failed to get cache:', error);
  }

  return null;
}

/**
 * Supprime une entrée du cache
 */
export function removeCache(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
    if (isIndexedDBAvailable()) {
      removeIndexedDBCache(key);
    }
  } catch (error) {
    console.warn('Failed to remove cache:', error);
  }
}

/**
 * Nettoie le cache expiré
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
            const entry: CacheEntry<unknown> = JSON.parse(cached);
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
    console.warn('Failed to clean cache:', error);
  }
}

/**
 * IndexedDB helpers
 */
let db: IDBDatabase | null = null;

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
    console.warn('Failed to set IndexedDB cache:', error);
  }
}

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
    console.warn('Failed to get IndexedDB cache:', error);
    return null;
  }
}

function removeIndexedDBCache(key: string): void {
  openDB()
    .then((database) => {
      const transaction = database.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    })
    .catch((error) => {
      console.warn('Failed to remove IndexedDB cache:', error);
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

