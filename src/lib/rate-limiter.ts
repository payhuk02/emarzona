/**
 * Client-side Rate Limiter
 * Wrapper pour appeler l'Edge Function de rate limiting
 */

import { supabase } from '@/integrations/supabase/client';

export type RateLimitEndpoint = 'default' | 'auth' | 'api' | 'webhook';

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  error?: string;
  message?: string;
}

/**
 * Vérifie si la requête est autorisée par le rate limiter
 * @param endpoint - Type d'endpoint (auth, api, webhook, default)
 * @returns Promise avec le résultat du rate limiting
 */
export async function checkRateLimit(endpoint: RateLimitEndpoint = 'default'): Promise<RateLimitResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { endpoint }
    });

    if (error) {
      console.error('[RateLimiter] Error:', error);
      // En cas d'erreur, autoriser par défaut (fail open)
      return {
        allowed: true,
        remaining: 100,
        resetAt: new Date(Date.now() + 60000).toISOString()
      };
    }

    return data;
  } catch (error) {
    console.error('[RateLimiter] Exception:', error);
    // En cas d'exception, autoriser par défaut
    return {
      allowed: true,
      remaining: 100,
      resetAt: new Date(Date.now() + 60000).toISOString()
    };
  }
}

/**
 * Hook React pour le rate limiting
 */
export function useRateLimit(endpoint: RateLimitEndpoint = 'default') {
  const check = async () => {
    return await checkRateLimit(endpoint);
  };

  return { check };
}

/**
 * Middleware rate limiting pour protéger les actions sensibles
 */
export async function withRateLimit<T>(
  endpoint: RateLimitEndpoint,
  action: () => Promise<T>
): Promise<T> {
  const result = await checkRateLimit(endpoint);

  if (!result.allowed) {
    throw new Error(result.message || 'Rate limit exceeded. Please try again later.');
  }

  return await action();
}

