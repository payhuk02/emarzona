/**
 * Système de cache LocalStorage
 * Gère le stockage local des données pour améliorer les performances
 * et permettre une expérience offline partielle
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private readonly prefix = 'payhuk_cache_';

  /**
   * Stocke une donnée dans le cache avec une durée d'expiration
   * @param key Clé unique pour identifier la donnée
   * @param data Données à stocker
   * @param ttl Time To Live en millisecondes (défaut: 1 heure)
   */
  set<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.error(`[Cache] Error setting ${key}:`, error);
      // Si quota dépassé, nettoyer le cache
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearExpired();
      }
    }
  }

  /**
   * Récupère une donnée du cache
   * @param key Clé de la donnée
   * @returns La donnée ou null si expirée/inexistante
   */
  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(`${this.prefix}${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);

      // Vérifier si le cache est expiré
      if (Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error(`[Cache] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprime une entrée du cache
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error(`[Cache] Error removing ${key}:`, error);
    }
  }

  /**
   * Vérifie si une clé existe dans le cache et est valide
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Nettoie toutes les entrées expirées du cache
   */
  clearExpired(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            try {
              const item: CacheItem<unknown> = JSON.parse(itemStr);
              if (Date.now() > item.expiresAt) {
                keysToRemove.push(key);
              }
            } catch {
              // Entrée invalide, la supprimer
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[Cache] Cleared ${keysToRemove.length} expired entries`);
    } catch (error) {
      console.error('[Cache] Error clearing expired:', error);
    }
  }

  /**
   * Vide tout le cache de l'application
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[Cache] Cleared all ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.error('[Cache] Error clearing all:', error);
    }
  }

  /**
   * Obtient la taille totale du cache en bytes
   */
  getSize(): number {
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    return totalSize;
  }

  /**
   * Obtient la taille du cache en format lisible
   */
  getSizeFormatted(): string {
    const size = this.getSize();
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Instance unique du gestionnaire de cache
export const cache = new CacheManager();

// Nettoyer automatiquement les entrées expirées au chargement
if (typeof window !== 'undefined') {
  cache.clearExpired();
  
  // Nettoyer périodiquement (toutes les 5 minutes)
  setInterval(() => {
    cache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Hook helper pour utiliser le cache dans les composants React
 */
export const useCacheKey = (key: string) => ({
  get: <T>() => cache.get<T>(key),
  set: <T>(data: T, ttl?: number) => cache.set(key, data, ttl),
  remove: () => cache.remove(key),
  has: () => cache.has(key),
});

