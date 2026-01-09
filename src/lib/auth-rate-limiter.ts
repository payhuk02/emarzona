/**
 * Rate Limiter spécialisé pour les actions d'authentification
 * Protège contre les attaques par force brute et les abus
 */

import { checkRateLimit } from './rate-limiter';
import { logger } from './logger';

export type AuthAction =
  | 'login'
  | 'register'
  | 'reset-password'
  | 'verify-2fa'
  | 'resend-verification';

/**
 * Limites spécifiques pour chaque action d'authentification
 */
const AUTH_RATE_LIMITS: Record<AuthAction, { maxRequests: number; windowSeconds: number }> = {
  login: { maxRequests: 5, windowSeconds: 300 }, // 5 tentatives par 5 minutes
  register: { maxRequests: 3, windowSeconds: 3600 }, // 3 inscriptions par heure
  'reset-password': { maxRequests: 3, windowSeconds: 3600 }, // 3 réinitialisations par heure
  'verify-2fa': { maxRequests: 5, windowSeconds: 300 }, // 5 vérifications par 5 minutes
  'resend-verification': { maxRequests: 3, windowSeconds: 600 }, // 3 renvois par 10 minutes
};

/**
 * Vérifie si une action d'authentification est autorisée selon le rate limit
 *
 * @param action - Type d'action d'authentification
 * @param identifier - Identifiant unique (email, userId, ou IP)
 * @returns Promise avec le résultat (allowed, remaining, resetAt)
 *
 * @example
 * ```typescript
 * const result = await checkAuthRateLimit('login', email);
 * if (!result.allowed) {
 *   toast.error('Trop de tentatives. Réessayez dans quelques minutes.');
 *   return;
 * }
 * ```
 */
export async function checkAuthRateLimit(
  action: AuthAction,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: string; message?: string }> {
  // Utiliser l'endpoint 'auth' avec l'identifiant comme userId
  const result = await checkRateLimit('auth', identifier);

  // Logger les violations de rate limit pour sécurité
  if (!result.allowed) {
    logger.warn('[AuthRateLimit] Rate limit exceeded', {
      action,
      identifier: identifier.substring(0, 3) + '***', // Masquer l'identifiant complet
      remaining: result.remaining,
      resetAt: result.resetAt,
    });
  }

  // Message personnalisé selon l'action
  let message: string | undefined;
  if (!result.allowed) {
    const limits = AUTH_RATE_LIMITS[action];
    const minutes = Math.ceil(limits.windowSeconds / 60);
    message = `Trop de tentatives pour ${action}. Réessayez dans ${minutes} minutes.`;
  }

  return {
    ...result,
    message,
  };
}

/**
 * Hook React pour vérifier le rate limit d'authentification
 *
 * @param action - Type d'action d'authentification
 * @returns Fonction pour vérifier le rate limit et état
 *
 * @example
 * ```typescript
 * const { check, isAllowed, remaining } = useAuthRateLimit('login');
 *
 * const handleLogin = async () => {
 *   const result = await check(email);
 *   if (!result.allowed) {
 *     toast.error(result.message);
 *     return;
 *   }
 *   // Procéder avec le login
 * };
 * ```
 */
import { useState } from 'react';

export function useAuthRateLimit(action: AuthAction) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<{
    allowed: boolean;
    remaining: number;
    resetAt: string;
    message?: string;
  } | null>(null);

  const check = async (identifier: string) => {
    setIsChecking(true);
    try {
      const result = await checkAuthRateLimit(action, identifier);
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
    remaining: lastResult?.remaining ?? AUTH_RATE_LIMITS[action].maxRequests,
    message: lastResult?.message,
  };
}
