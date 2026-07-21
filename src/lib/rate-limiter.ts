/**
 * Client-side Rate Limiter - Version Renforcée
 * Wrapper pour appeler l'Edge Function de rate limiting avec cache local
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import * as Sentry from '@sentry/react';

export type RateLimitEndpoint =
  | 'default'
  | 'auth'
  | 'api'
  | 'webhook'
  | 'payment'
  | 'checkout'
  | 'upload'
  | 'search';

export type ServerAuthAction =
  | 'login'
  | 'register'
  | 'reset-password'
  | 'verify-2fa'
  | 'resend-verification';

const FAIL_CLOSED_ENDPOINTS: ReadonlySet<RateLimitEndpoint> = new Set(['payment', 'checkout']);

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
  error?: string;
  message?: string;
}

interface RateLimitCache {
  [key: string]: {
    response: RateLimitResponse;
    timestamp: number;
  };
}

// Cache local pour éviter les appels répétés
const rateLimitCache: RateLimitCache = {};
const CACHE_TTL = 1000; // 1 seconde de cache

/**
 * Nettoie le cache expiré
 */
const cleanCache = (): void => {
  const now = Date.now();
  Object.keys(rateLimitCache).forEach(key => {
    if (now - rateLimitCache[key].timestamp > CACHE_TTL) {
      delete rateLimitCache[key];
    }
  });
};

/**
 * Nettoie complètement le cache (utilisé uniquement pour les tests)
 * @internal
 */
export function clearRateLimitCache(): void {
  Object.keys(rateLimitCache).forEach(key => {
    delete rateLimitCache[key];
  });
}

/**
 * Rate limit auth côté serveur (Edge Function + rate_limit_log).
 * Autoritaire ; retourne degraded=true si le service est indisponible.
 */
export async function checkServerAuthRateLimit(
  authAction: ServerAuthAction,
  identifier: string
): Promise<RateLimitResponse & { degraded?: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: {
        endpoint: 'auth',
        authAction,
        identifier: identifier.trim().toLowerCase(),
        timestamp: Date.now(),
      },
    });

    if (error) {
      const errorStatus =
        typeof error === 'object' &&
        error !== null &&
        'context' in error &&
        typeof (error as { context?: { status?: number } }).context?.status === 'number'
          ? (error as { context?: { status?: number } }).context!.status
          : undefined;

      if (errorStatus === 429) {
        const errData = (error as { context?: { body?: unknown } }).context?.body;
        const parsed =
          errData && typeof errData === 'object'
            ? (errData as { resetAt?: string; message?: string })
            : {};
        return {
          allowed: false,
          remaining: 0,
          limit: 5,
          resetAt:
            typeof parsed.resetAt === 'string'
              ? parsed.resetAt
              : new Date(Date.now() + 300000).toISOString(),
          message:
            typeof parsed.message === 'string'
              ? parsed.message
              : 'Trop de tentatives. Réessayez plus tard.',
          degraded: false,
        };
      }

      logger.warn('[AuthRateLimit] Server check failed', { authAction, error: error.message });
      return {
        allowed: true,
        remaining: 5,
        limit: 5,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        degraded: true,
      };
    }

    if (data?.error && data?.allowed === false) {
      return {
        allowed: false,
        remaining: typeof data.remaining === 'number' ? data.remaining : 0,
        limit: typeof data.limit === 'number' ? data.limit : 0,
        resetAt: typeof data.resetAt === 'string' ? data.resetAt : new Date().toISOString(),
        message:
          typeof data.message === 'string'
            ? data.message
            : 'Trop de tentatives. Réessayez plus tard.',
        degraded: Boolean(data.degraded),
      };
    }

    return {
      allowed: Boolean(data?.allowed ?? true),
      remaining: typeof data?.remaining === 'number' ? data.remaining : 0,
      resetAt: typeof data?.resetAt === 'string' ? data.resetAt : new Date().toISOString(),
      limit: typeof data?.limit === 'number' ? data.limit : 100,
      message: typeof data?.message === 'string' ? data.message : undefined,
      degraded: false,
    };
  } catch (err) {
    logger.warn('[AuthRateLimit] Server exception', { authAction, err });
    return {
      allowed: true,
      remaining: 5,
      limit: 5,
      resetAt: new Date(Date.now() + 60000).toISOString(),
      degraded: true,
    };
  }
}

/**
 * Génère une clé de cache pour un endpoint
 */
const getCacheKey = (endpoint: RateLimitEndpoint, userId?: string): string => {
  return `${endpoint}:${userId || 'anonymous'}`;
};

/**
 * Vérifie si la requête est autorisée par le rate limiter
 *
 * Cette fonction vérifie les limites de taux pour différents types d'endpoints.
 * Utilise un cache local pour éviter les appels répétés au serveur.
 *
 * @param endpoint - Type d'endpoint à vérifier (auth, api, webhook, default, payment, upload, search)
 * @param userId - ID de l'utilisateur (optionnel, pour un rate limiting par utilisateur)
 * @param bypassCache - Forcer un appel serveur même si un résultat est en cache (par défaut: false)
 * @returns Promise avec le résultat du rate limiting (allowed, remaining, resetAt, limit)
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit('api', userId);
 * if (result.allowed) {
 *   // Effectuer la requête
 * } else {
 *   // Afficher un message d'erreur
 * }
 * ```
 */
export async function checkRateLimit(
  endpoint: RateLimitEndpoint = 'default',
  userId?: string,
  bypassCache: boolean = false
): Promise<RateLimitResponse> {
  // Nettoyer le cache périodiquement
  cleanCache();

  const cacheKey = getCacheKey(endpoint, userId);

  // Vérifier le cache si disponible
  if (!bypassCache && rateLimitCache[cacheKey]) {
    const cached = rateLimitCache[cacheKey];
    const now = Date.now();

    // Si le cache est encore valide, retourner la réponse mise en cache
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.response;
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: {
        endpoint,
        userId,
        timestamp: Date.now(),
      },
    });

    if (error) {
      logger.error('[RateLimiter] Error:', error);

      const errorStatus =
        typeof error === 'object' &&
        error !== null &&
        'context' in error &&
        typeof (error as { context?: { status?: number } }).context?.status === 'number'
          ? (error as { context?: { status?: number } }).context!.status
          : undefined;

      Sentry.captureException(error, {
        tags: {
          component: 'rate-limiter',
          endpoint,
        },
        extra: {
          userId,
        },
      });

      const authMisconfigured = errorStatus === 401;
      const failClosed = FAIL_CLOSED_ENDPOINTS.has(endpoint) && !authMisconfigured;
      const fallbackResponse: RateLimitResponse = {
        allowed: !failClosed,
        remaining: failClosed ? 0 : 10,
        limit: failClosed ? 0 : 10,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        message: failClosed
          ? 'Protection paiement temporairement indisponible. Réessayez dans un instant.'
          : authMisconfigured
            ? undefined
            : undefined,
        error: failClosed ? 'Rate limit service unavailable' : undefined,
      };

      rateLimitCache[cacheKey] = {
        response: fallbackResponse,
        timestamp: Date.now(),
      };

      return fallbackResponse;
    }

    const response: RateLimitResponse = {
      allowed: Boolean(data?.allowed ?? true),
      remaining: typeof data?.remaining === 'number' ? data.remaining : 0,
      resetAt: typeof data?.resetAt === 'string' ? data.resetAt : new Date().toISOString(),
      limit: typeof data?.limit === 'number' ? data.limit : 100,
      message: typeof data?.message === 'string' ? data.message : undefined,
      error: typeof data?.error === 'string' ? data.error : undefined,
    };

    // Mettre en cache la réponse
    rateLimitCache[cacheKey] = {
      response,
      timestamp: Date.now(),
    };

    // Logger les violations de rate limit
    if (!response.allowed) {
      logger.warn('[RateLimiter] Rate limit exceeded:', {
        endpoint,
        userId,
        remaining: response.remaining,
        resetAt: response.resetAt,
      });

      // Envoyer à Sentry pour monitoring
      Sentry.captureMessage('Rate limit exceeded', {
        level: 'warning',
        tags: {
          component: 'rate-limiter',
          endpoint,
        },
        extra: {
          userId,
          remaining: response.remaining,
          resetAt: response.resetAt,
        },
      });
    }

    return response;
  } catch (_error: unknown) {
    const errorObj = _error instanceof Error ? _error : new Error('Unknown error');
    logger.error('[RateLimiter] Exception:', errorObj);

    // Envoyer à Sentry
    Sentry.captureException(errorObj, {
      tags: {
        component: 'rate-limiter',
        endpoint,
      },
      extra: {
        userId,
      },
    });

    const failClosed = FAIL_CLOSED_ENDPOINTS.has(endpoint);
    const fallbackResponse: RateLimitResponse = {
      allowed: !failClosed,
      remaining: failClosed ? 0 : 10,
      limit: failClosed ? 0 : 10,
      resetAt: new Date(Date.now() + 60000).toISOString(),
      message: failClosed
        ? 'Protection paiement temporairement indisponible. Réessayez dans un instant.'
        : undefined,
      error: failClosed ? 'Rate limit service unavailable' : undefined,
    };

    rateLimitCache[cacheKey] = {
      response: fallbackResponse,
      timestamp: Date.now(),
    };

    return fallbackResponse;
  }
}

/**
 * Hook React pour le rate limiting avec état
 */
export function useRateLimit(endpoint: RateLimitEndpoint = 'default') {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<RateLimitResponse | null>(null);

  const check = async (userId?: string, bypassCache: boolean = false) => {
    setIsChecking(true);
    try {
      const result = await checkRateLimit(endpoint, userId, bypassCache);
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    check,
    isChecking,
    lastResult,
    isAllowed: lastResult?.allowed ?? true,
    remaining: lastResult?.remaining ?? 100,
  };
}

/**
 * Middleware rate limiting pour protéger les actions sensibles
 *
 * Wrapper qui vérifie le rate limit avant d'exécuter une action.
 * Supporte le retry automatique avec exponential backoff en cas de rate limit.
 *
 * @param endpoint - Type d'endpoint à protéger
 * @param action - Fonction à exécuter si le rate limit est respecté
 * @param options - Options de configuration
 * @param options.userId - ID de l'utilisateur pour rate limiting personnalisé
 * @param options.retry - Activer le retry automatique (par défaut: false)
 * @param options.maxRetries - Nombre maximum de tentatives (par défaut: 3)
 * @param options.retryDelay - Délai initial entre les tentatives en ms (par défaut: 1000)
 * @returns Promise avec le résultat de l'action, ou throw une erreur si rate limit dépassé
 *
 * @example
 * ```typescript
 * const result = await withRateLimit('payment', async () => {
 *   return await processPayment(data);
 * }, {
 *   userId: user.id,
 *   retry: true,
 *   maxRetries: 3
 * });
 * ```
 *
 * @throws {Error} Si le rate limit est dépassé et retry est désactivé ou maxRetries atteint
 */
export async function withRateLimit<T>(
  endpoint: RateLimitEndpoint,
  action: () => Promise<T>,
  options?: {
    userId?: string;
    retry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<T> {
  const { userId, retry = false, maxRetries = 3, retryDelay = 1000 } = options || {};

  let attempts = 0;

  while (attempts < maxRetries) {
    const result = await checkRateLimit(endpoint, userId, attempts > 0);

    if (!result.allowed) {
      if (retry && attempts < maxRetries - 1) {
        attempts++;
        const delay = retryDelay * Math.pow(2, attempts - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const error = new Error(result.message || 'Rate limit exceeded. Please try again later.');
      // Ajouter les infos de rate limit à l'erreur
      Object.assign(error, {
        rateLimitInfo: {
          remaining: result.remaining,
          resetAt: result.resetAt,
          limit: result.limit,
        },
      });
      throw error;
    }

    // Si autorisé, exécuter l'action
    return await action();
  }

  throw new Error('Max retries exceeded for rate limit check');
}

/**
 * Décorateur pour protéger automatiquement les fonctions avec rate limiting
 */
export function rateLimited(
  endpoint: RateLimitEndpoint,
  options?: {
    userId?: () => string | undefined;
    retry?: boolean;
  }
) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const userId = options?.userId?.call(this);

      return withRateLimit(endpoint, () => originalMethod.apply(this, args), {
        userId,
        retry: options?.retry,
      });
    };

    return descriptor;
  };
}
