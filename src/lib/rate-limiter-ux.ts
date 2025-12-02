/**
 * Rate Limiter UX - Amélioration de l'expérience utilisateur
 * Affiche des notifications toast lorsque le rate limit est atteint
 */

import { toast } from 'sonner';
import { checkRateLimit, type RateLimitEndpoint } from './rate-limiter';
import { logger } from './logger';

interface RateLimitUXOptions {
  endpoint: RateLimitEndpoint;
  userId?: string;
  showToast?: boolean;
  toastMessage?: string;
  onRateLimitExceeded?: () => void;
}

/**
 * Vérifie le rate limit avec feedback UX
 * Affiche un toast si le rate limit est atteint
 */
export async function checkRateLimitWithUX(
  options: RateLimitUXOptions
): Promise<boolean> {
  const {
    endpoint,
    userId,
    showToast = true,
    toastMessage,
    onRateLimitExceeded,
  } = options;

  try {
    const result = await checkRateLimit(endpoint, userId);

    if (!result.allowed) {
      // Rate limit atteint
      if (showToast) {
        const message = toastMessage || 
          `Trop de requêtes. Réessayez dans ${getTimeUntilReset(result.resetAt)}`;
        
        toast.error('Limite atteinte', {
          description: message,
          duration: 5000,
        });
      }

      // Callback personnalisé
      onRateLimitExceeded?.();

      logger.warn('[RateLimiterUX] Rate limit exceeded', {
        endpoint,
        userId,
        remaining: result.remaining,
        resetAt: result.resetAt,
      });

      return false;
    }

    // Afficher un avertissement si proche de la limite
    if (result.remaining <= 5 && result.remaining > 0) {
      if (showToast) {
        toast.warning('Attention', {
          description: `Il vous reste ${result.remaining} requête${result.remaining > 1 ? 's' : ''} avant la limite`,
          duration: 3000,
        });
      }
    }

    return true;
  } catch (error) {
    logger.error('[RateLimiterUX] Error checking rate limit', { error });
    // En cas d'erreur, autoriser par défaut (fail open)
    return true;
  }
}

/**
 * Calcule le temps jusqu'au reset du rate limit
 */
function getTimeUntilReset(resetAt: string): string {
  const resetDate = new Date(resetAt);
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return 'quelques secondes';
  }

  const seconds = Math.ceil(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
}

/**
 * Hook pour utiliser le rate limiter avec UX dans les composants React
 */
export function useRateLimitUX(endpoint: RateLimitEndpoint) {
  const checkWithUX = async (
    action: () => Promise<void> | void,
    options?: {
      userId?: string;
      showToast?: boolean;
      toastMessage?: string;
    }
  ) => {
    const allowed = await checkRateLimitWithUX({
      endpoint,
      ...options,
    });

    if (allowed) {
      await action();
    }
  };

  return { checkWithUX };
}

