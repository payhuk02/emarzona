/**
 * Rate Limiter pour Moneroo
 * Protège l'API contre la surcharge avec un système de fenêtre glissante
 */

import { logger } from './logger';

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string; // Pour différencier les limites par utilisateur/store
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * Rate Limiter en mémoire avec fenêtre glissante
 */
class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    
    // Nettoyer les anciennes entrées toutes les 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Vérifie si une requête peut être effectuée
   * @param identifier - Identifiant unique (userId, storeId, ou 'global')
   * @returns true si la requête est autorisée, false sinon
   */
  canMakeRequest(identifier: string = 'global'): boolean {
    const key = this.config.identifier 
      ? `${this.config.identifier}:${identifier}` 
      : identifier;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Récupérer ou créer l'enregistrement
    let records = this.requests.get(key);
    
    if (!records) {
      records = [];
      this.requests.set(key, records);
    }
    
    // Nettoyer les requêtes hors de la fenêtre
    const validRecords = records.filter(record => record.timestamp > windowStart);
    
    // Compter le nombre total de requêtes dans la fenêtre
    const totalRequests = validRecords.reduce((sum, record) => sum + record.count, 0);
    
    // Vérifier si on peut faire une nouvelle requête
    if (totalRequests >= this.config.maxRequests) {
      const oldestRequest = validRecords[0];
      const timeUntilReset = oldestRequest 
        ? (oldestRequest.timestamp + this.config.windowMs) - now
        : this.config.windowMs;
      
      logger.warn('[RateLimiter] Rate limit exceeded', {
        identifier: key,
        totalRequests,
        maxRequests: this.config.maxRequests,
        timeUntilReset: Math.ceil(timeUntilReset / 1000) + 's',
      });
      
      return false;
    }
    
    // Ajouter la nouvelle requête
    validRecords.push({
      timestamp: now,
      count: 1,
    });
    
    this.requests.set(key, validRecords);
    
    return true;
  }

  /**
   * Enregistre une requête (appelé après une requête réussie)
   */
  recordRequest(identifier: string = 'global'): void {
    // La requête est déjà enregistrée dans canMakeRequest
    // Cette méthode peut être utilisée pour des statistiques supplémentaires
    const key = this.config.identifier 
      ? `${this.config.identifier}:${identifier}` 
      : identifier;
    
    logger.debug('[RateLimiter] Request recorded', {
      identifier: key,
      remainingRequests: this.getRemainingRequests(identifier),
    });
  }

  /**
   * Obtient le nombre de requêtes restantes
   */
  getRemainingRequests(identifier: string = 'global'): number {
    const key = this.config.identifier 
      ? `${this.config.identifier}:${identifier}` 
      : identifier;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const records = this.requests.get(key);
    if (!records) {
      return this.config.maxRequests;
    }
    
    const validRecords = records.filter(record => record.timestamp > windowStart);
    const totalRequests = validRecords.reduce((sum, record) => sum + record.count, 0);
    
    return Math.max(0, this.config.maxRequests - totalRequests);
  }

  /**
   * Obtient le temps jusqu'à la prochaine requête autorisée
   */
  getTimeUntilReset(identifier: string = 'global'): number {
    const key = this.config.identifier 
      ? `${this.config.identifier}:${identifier}` 
      : identifier;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const records = this.requests.get(key);
    if (!records || records.length === 0) {
      return 0;
    }
    
    const validRecords = records.filter(record => record.timestamp > windowStart);
    if (validRecords.length === 0) {
      return 0;
    }
    
    const oldestRequest = validRecords[0];
    return Math.max(0, (oldestRequest.timestamp + this.config.windowMs) - now);
  }

  /**
   * Réinitialise le compteur pour un identifiant
   */
  reset(identifier: string = 'global'): void {
    const key = this.config.identifier 
      ? `${this.config.identifier}:${identifier}` 
      : identifier;
    
    this.requests.delete(key);
    logger.debug('[RateLimiter] Reset', { identifier: key });
  }

  /**
   * Nettoie les anciennes entrées
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, records] of this.requests.entries()) {
      const validRecords = records.filter(record => record.timestamp > windowStart);
      
      if (validRecords.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRecords);
      }
    }
  }

  /**
   * Obtient les statistiques du rate limiter
   */
  getStats(identifier: string = 'global'): {
    remaining: number;
    used: number;
    max: number;
    timeUntilReset: number;
  } {
    return {
      remaining: this.getRemainingRequests(identifier),
      used: this.config.maxRequests - this.getRemainingRequests(identifier),
      max: this.config.maxRequests,
      timeUntilReset: this.getTimeUntilReset(identifier),
    };
  }
}

/**
 * Rate Limiter global pour Moneroo
 * Limite: 100 requêtes par minute par défaut
 */
export const monerooRateLimiter = new RateLimiter({
  maxRequests: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_MAX || '100', 10),
  windowMs: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
});

/**
 * Rate Limiter par utilisateur
 * Limite: 50 requêtes par minute par utilisateur
 */
export function createUserRateLimiter(userId: string): RateLimiter {
  return new RateLimiter({
    maxRequests: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_USER_MAX || '50', 10),
    windowMs: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_WINDOW_MS || '60000', 10),
    identifier: 'user',
  });
}

/**
 * Rate Limiter par store
 * Limite: 200 requêtes par minute par store
 */
export function createStoreRateLimiter(storeId: string): RateLimiter {
  return new RateLimiter({
    maxRequests: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_STORE_MAX || '200', 10),
    windowMs: parseInt(import.meta.env.VITE_MONEROO_RATE_LIMIT_WINDOW_MS || '60000', 10),
    identifier: 'store',
  });
}

/**
 * Vérifie si une requête peut être effectuée et lance une erreur si la limite est dépassée
 */
export function checkRateLimit(identifier?: string): void {
  const canMakeRequest = identifier 
    ? monerooRateLimiter.canMakeRequest(identifier)
    : monerooRateLimiter.canMakeRequest();
  
  if (!canMakeRequest) {
    const timeUntilReset = identifier
      ? monerooRateLimiter.getTimeUntilReset(identifier)
      : monerooRateLimiter.getTimeUntilReset();
    
    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before making another request.`
    );
  }
}


