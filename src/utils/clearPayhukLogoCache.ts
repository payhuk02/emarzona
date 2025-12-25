/**
 * Utilitaire pour nettoyer le cache localStorage contenant l'ancien logo Payhuk
 * À exécuter au chargement de l'application pour supprimer les références obsolètes
 */

import { logger } from '@/lib/logger';

const LOGO_CACHE_KEY = 'platform-logo-cache';

/**
 * Nettoie le cache localStorage si il contient des références à Payhuk
 */
export const clearPayhukLogoCache = (): void => {
  try {
    const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
    if (cachedLogo) {
      const cached = JSON.parse(cachedLogo);
      
      // Vérifier si le cache contient des références à Payhuk
      const hasPayhukReference = 
        (cached.light && (cached.light.toLowerCase().includes('payhuk') || cached.light.includes('/payhuk'))) ||
        (cached.dark && (cached.dark.toLowerCase().includes('payhuk') || cached.dark.includes('/payhuk')));
      
      if (hasPayhukReference) {
        // Nettoyer le cache
        localStorage.removeItem(LOGO_CACHE_KEY);
        logger.info('Cache logo Payhuk nettoyé');
      }
    }
  } catch (error) {
    // Ignorer les erreurs de cache
    logger.warn('Erreur lors du nettoyage du cache logo', { error });
  }
};

/**
 * Nettoie également les autres clés de cache qui pourraient contenir Payhuk
 */
export const clearAllPayhukReferences = (): void => {
  try {
    // Liste des clés de cache potentielles
    const cacheKeys = [
      'platform-logo-cache',
      'platform_logo_cache',
      'logo_cache',
      'customization_cache',
    ];
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hasPayhukReference = 
            JSON.stringify(parsed).toLowerCase().includes('payhuk') ||
            (parsed.light && parsed.light.toLowerCase().includes('payhuk')) ||
            (parsed.dark && parsed.dark.toLowerCase().includes('payhuk'));
          
          if (hasPayhukReference) {
            localStorage.removeItem(key);
            logger.info(`Cache ${key} nettoyé`);
          }
        }
      } catch (error) {
        // Ignorer les erreurs pour cette clé
      }
    });
  } catch (error) {
    logger.warn('Erreur lors du nettoyage des caches', { error });
  }
};

