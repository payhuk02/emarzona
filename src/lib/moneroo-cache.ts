/**
 * Système de cache pour les statistiques Moneroo
 * Utilise un cache en mémoire avec TTL (Time To Live)
 */

import { logger } from './logger';

export interface CacheConfig {
  ttl: number; // Time To Live en millisecondes
  maxSize: number; // Nombre maximum d'entrées
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache simple en mémoire avec TTL
 */
class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Nettoyer les entrées expirées toutes les 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Obtient une valeur du cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    logger.debug('[MonerooCache] Cache hit', { key });
    return entry.data;
  }

  /**
   * Définit une valeur dans le cache
   */
  set(key: string, value: T, customTtl?: number): void {
    // Si le cache est plein, supprimer l'entrée la plus ancienne
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        logger.debug('[MonerooCache] Evicted oldest entry', { key: oldestKey });
      }
    }
    
    const now = Date.now();
    const ttl = customTtl || this.config.ttl;
    
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + ttl,
    });
    
    logger.debug('[MonerooCache] Cache set', { key, ttl });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug('[MonerooCache] Cache deleted', { key });
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug('[MonerooCache] Cache cleared');
  }

  /**
   * Vérifie si une clé existe et n'est pas expirée
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Obtient ou définit une valeur (get-or-set pattern)
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Générer la valeur
    const value = await factory();
    this.set(key, value, customTtl);
    
    return value;
  }

  /**
   * Trouve la clé de l'entrée la plus ancienne
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('[MonerooCache] Cleanup', { cleaned, remaining: this.cache.size });
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // TODO: Implémenter le tracking des hits/misses
    };
  }
}

/**
 * Cache pour les statistiques Moneroo
 * TTL: 5 minutes par défaut
 */
export const monerooStatsCache = new Cache<any>({
  ttl: parseInt(import.meta.env.VITE_MONEROO_CACHE_TTL_MS || '300000', 10), // 5 minutes
  maxSize: parseInt(import.meta.env.VITE_MONEROO_CACHE_MAX_SIZE || '1000', 10),
});

/**
 * Génère une clé de cache pour les statistiques
 */
export function generateStatsCacheKey(
  type: 'payments' | 'revenue' | 'time' | 'methods' | 'byDate' | 'all',
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): string {
  const parts = ['moneroo', 'stats', type];
  
  if (startDate) {
    parts.push('start', startDate.toISOString().split('T')[0]);
  }
  
  if (endDate) {
    parts.push('end', endDate.toISOString().split('T')[0]);
  }
  
  if (storeId) {
    parts.push('store', storeId);
  }
  
  return parts.join(':');
}


