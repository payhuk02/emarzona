/**
 * Rate limiter auth : serveur autoritaire (Edge) + fallback client (sessionStorage).
 * Le compteur client ne s'applique qu'en mode dégradé (Edge indisponible).
 */

import { useState } from 'react';
import { logger } from './logger';
import { checkServerAuthRateLimit } from './rate-limiter';
import { buildAuthRateLimitEndpoint } from './auth-identifier-hash';

export type AuthAction =
  | 'login'
  | 'register'
  | 'reset-password'
  | 'verify-2fa'
  | 'resend-verification';

export const AUTH_RATE_LIMITS: Record<AuthAction, { maxRequests: number; windowSeconds: number }> =
  {
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

export interface AuthRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  message?: string;
  source: 'server' | 'client-fallback';
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
    // sessionStorage indisponible — fail open côté client
  }
}

function buildClientStorageKey(action: AuthAction, identifier: string): string {
  return buildAuthRateLimitEndpoint(action, identifier);
}

function checkAuthRateLimitLocal(action: AuthAction, identifier: string): AuthRateLimitResult {
  const limits = AUTH_RATE_LIMITS[action];
  const key = buildClientStorageKey(action, identifier);
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
    logger.warn('[AuthRateLimit] Client fallback limit exceeded', {
      action,
      identifier: identifier.substring(0, 3) + '***',
    });
  }

  return {
    allowed,
    remaining,
    resetAt,
    message,
    source: 'client-fallback',
  };
}

function formatBlockedMessage(resetAt: string): string {
  const minutes = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 60000));
  return `Trop de tentatives. Réessayez dans ${minutes} minute(s).`;
}

/**
 * Vérifie le rate limit auth — serveur d'abord, client en secours dégradé.
 */
export async function checkAuthRateLimit(
  action: AuthAction,
  identifier: string
): Promise<AuthRateLimitResult> {
  const normalized = identifier.trim();
  if (!normalized) {
    return {
      allowed: true,
      remaining: AUTH_RATE_LIMITS[action].maxRequests,
      resetAt: new Date(Date.now() + AUTH_RATE_LIMITS[action].windowSeconds * 1000).toISOString(),
      source: 'server',
    };
  }

  const server = await checkServerAuthRateLimit(action, normalized);

  if (!server.degraded) {
    if (!server.allowed) {
      logger.warn('[AuthRateLimit] Server limit exceeded', {
        action,
        identifier: normalized.substring(0, 3) + '***',
      });
      return {
        allowed: false,
        remaining: server.remaining,
        resetAt: server.resetAt,
        message: server.message ?? formatBlockedMessage(server.resetAt),
        source: 'server',
      };
    }

    return {
      allowed: true,
      remaining: server.remaining,
      resetAt: server.resetAt,
      source: 'server',
    };
  }

  logger.warn('[AuthRateLimit] Degraded — using client fallback', { action });
  return checkAuthRateLimitLocal(action, normalized);
}

export function useAuthRateLimit(action: AuthAction) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<AuthRateLimitResult | null>(null);

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
