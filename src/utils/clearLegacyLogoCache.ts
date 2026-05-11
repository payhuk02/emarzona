/**
 * Utilitaire pour nettoyer le cache localStorage contenant d'anciens logos obsoletes.
 * A executer au chargement de l'application pour supprimer les references legacy.
 */

import { logger } from '@/lib/logger';

const LOGO_CACHE_KEY = 'platform-logo-cache';

/**
 * Nettoie le cache localStorage si il contient des references legacy.
 */
export const clearLegacyLogoCache = (): void => {
  try {
    const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
    if (cachedLogo) {
      const cached = JSON.parse(cachedLogo);

      // Verification simple de marqueurs legacy dans les URLs mises en cache
      const hasLegacyReference =
        (cached.light &&
          (cached.light.toLowerCase().includes('legacy') || cached.light.includes('/old-logo'))) ||
        (cached.dark &&
          (cached.dark.toLowerCase().includes('legacy') || cached.dark.includes('/old-logo')));

      if (hasLegacyReference) {
        localStorage.removeItem(LOGO_CACHE_KEY);
        logger.info('Cache logo legacy nettoye');
      }
    }
  } catch (error) {
    logger.warn('Erreur lors du nettoyage du cache logo', { error });
  }
};

/**
 * Nettoie egalement les autres cles de cache qui pourraient contenir des references legacy.
 */
export const clearAllLegacyLogoReferences = (): void => {
  try {
    const cacheKeys = ['platform-logo-cache', 'platform_logo_cache', 'logo_cache', 'customization_cache'];

    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hasLegacyReference =
            JSON.stringify(parsed).toLowerCase().includes('legacy') ||
            (parsed.light && parsed.light.toLowerCase().includes('legacy')) ||
            (parsed.dark && parsed.dark.toLowerCase().includes('legacy'));

          if (hasLegacyReference) {
            localStorage.removeItem(key);
            logger.info(`Cache ${key} nettoye`);
          }
        }
      } catch {
        // ignorer erreurs de parsing par cle
      }
    });
  } catch (error) {
    logger.warn('Erreur lors du nettoyage des caches', { error });
  }
};
