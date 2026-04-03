/**
 * Utilitaires pour la gestion du cache
 * Fournit des fonctions réutilisables pour gérer différents types de cache
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export interface CacheOptions {
  /**
   * Durée de vie en millisecondes
   * @default Infinity (pas d'expiration)
   */
  ttl?: number;
  /**
   * Taille maximale du cache
   * @default Infinity (pas de limite)
   */
  maxSize?: number;
}

/**
 * Cache en mémoire simple
 */
export class MemoryCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private ttl?: number;
  private maxSize?: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl;
    this.maxSize = options.maxSize;
  }

  /**
   * Définit une valeur dans le cache
   */
  set(key: K, value: V, customTtl?: number): void {
    // Si la taille maximale est atteinte, supprimer l'entrée la plus ancienne
    if (this.maxSize && this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl,
    });
  }

  /**
   * Obtient une valeur du cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Vérifier l'expiration
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtient la taille du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Nettoie les entrées expirées
   */
  clearExpired(): number {
    let  cleared= 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Obtient toutes les clés du cache
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtient toutes les valeurs du cache
   */
  values(): V[] {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Obtient toutes les entrées du cache
   */
  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }
}

/**
 * Cache LRU (Least Recently Used)
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;
  private ttl?: number;

  constructor(maxSize: number, ttl?: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Définit une valeur dans le cache
   */
  set(key: K, value: V, customTtl?: number): void {
    // Si la clé existe déjà, la supprimer pour la remettre à la fin
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer l'entrée la plus ancienne (première dans la Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl,
    });
  }

  /**
   * Obtient une valeur du cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Vérifier l'expiration
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Déplacer la clé à la fin (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtient la taille du cache
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Cache avec fonction de factory (getOrSet)
 */
export class FactoryCache<K, V> {
  private cache: MemoryCache<K, V>;

  constructor(options: CacheOptions = {}) {
    this.cache = new MemoryCache<K, V>(options);
  }

  /**
   * Obtient une valeur ou l'exécute via la factory si absente
   */
  async getOrSet(
    key: K,
    factory: () => Promise<V>,
    customTtl?: number
  ): Promise<V> {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.cache.set(key, value, customTtl);
    return value;
  }

  /**
   * Obtient une valeur du cache
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Définit une valeur dans le cache
   */
  set(key: K, value: V, customTtl?: number): void {
    this.cache.set(key, value, customTtl);
  }

  /**
   * Supprime une clé du cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }
}







