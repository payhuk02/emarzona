/**
 * Rate Limiter spécialisé pour les actions d'authentification
 * Compteur local (sessionStorage) — ne dépend pas de l'Edge Function rate-limiter
 */

import { useState } from 'react';
import { logger } from './logger';

export type AuthAction =
  | 'login'
  | 'register'
  | 'reset-password'
  | 'verify-2fa'
  | 'resend-verification';

const AUTH_RATE_LIMITS: Record<AuthAction, { maxRequests: number; windowSeconds: number }> = {
  login: { maxRequests: 5, windowSeconds: 300 },
  register: { maxRequests: 3, windowSeconds: 3600 },
  'reset-password': { maxRequests: 3, windowSeconds: 3600 },
  'verify-2fa': { maxRequests: 5, windowSeconds: 300 },
  'resend-verification': { maxRequests: 3, windowSeconds: 600 },
};

const STORAGE_KEY = 'emarzona_auth_rate_limits';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function loadEntries(): Record<string, RateLimitEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RateLimitEntry>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveEntries(entries: Record<string, RateLimitEntry>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage indisponible (mode privé strict) — fail open
  }
}

/**
 * Vérifie si une action d'authentification est autorisée selon le rate limit
 */
export async function checkAuthRateLimit(
  action: AuthAction,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: string; message?: string }> {
  const limits = AUTH_RATE_LIMITS[action];
  const key = `${action}:${identifier.trim().toLowerCase()}`;
  const now = Date.now();
  const entries = loadEntries();

  let entry = entries[key];
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + limits.windowSeconds * 1000 };
  }

  entry = { ...entry, count: entry.count + 1 };
  entries[key] = entry;
  saveEntries(entries);

  const allowed = entry.count <= limits.maxRequests;
  const remaining = Math.max(0, limits.maxRequests - entry.count);
  const resetAt = new Date(entry.resetAt).toISOString();

  let message: string | undefined;
  if (!allowed) {
    const minutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
    message = `Trop de tentatives. Réessayez dans ${minutes} minute(s).`;
    logger.warn('[AuthRateLimit] Rate limit exceeded', {
      action,
      identifier: identifier.substring(0, 3) + '***',
      remaining,
      resetAt,
    });
  }

  return {
    allowed,
    remaining,
    resetAt,
    message,
  };
}

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
