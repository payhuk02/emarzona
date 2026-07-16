/**
 * Purge des caches navigateur liés à la session utilisateur.
 * Appelé à la déconnexion pour éviter les fuites inter-comptes.
 */

import { clearExchangeRateCache } from '@/lib/currency-exchange-api';
import { logger } from '@/lib/logger';
import { clearAllMarketplaceCache } from '@/lib/marketplace-cache';
import { geniuspayStatsCache } from '@/lib/geniuspay-cache';

export async function clearSessionBrowserCaches(): Promise<void> {
  try {
    await clearAllMarketplaceCache();
    geniuspayStatsCache.clear();
    clearExchangeRateCache();
    logger.debug('Session browser caches cleared');
  } catch (error) {
    logger.warn('Failed to clear session browser caches', { error });
  }
}
