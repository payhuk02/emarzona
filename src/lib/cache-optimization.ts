/**
 * Optimisation des stratégies de cache
 * Améliore les performances en gérant intelligemment le cache
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';
import { centralizedQueryConfig, centralizedMutationConfig } from './errors/centralized-error-handling';

/**
 * Configuration optimale du cache pour React Query
 */
export const createOptimizedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time : Temps avant qu'une donnée soit considérée comme stale
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time : Temps de rétention en cache après inactivité
        gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
        
        // Retry : Utiliser la configuration centralisée
        retry: centralizedQueryConfig.retry,
        retryDelay: centralizedQueryConfig.retryDelay,
        onError: centralizedQueryConfig.onError,
        
        // Refetch : Comportement de refetch
        refetchOnWindowFocus: false, // Ne pas refetch au focus (améliore les perfs)
        refetchOnReconnect: true, // Refetch à la reconnexion
        refetchOnMount: true, // Refetch au montage si stale
        
        // Network mode
        networkMode: 'online', // Seulement si en ligne
        
        // Optimisations supplémentaires
        structuralSharing: true, // Partage structurel pour éviter re-renders
        notifyOnChangeProps: ['data', 'error'], // Notifier seulement sur data/error
      },
      mutations: {
        // Retry : Utiliser la configuration centralisée
        retry: centralizedMutationConfig.retry,
        retryDelay: centralizedMutationConfig.retryDelay,
        onError: centralizedMutationConfig.onError,
        
        // Optimisations mutations
        networkMode: 'online',
      },
    },
  });
};

/**
 * Stratégies de cache par type de données
 */
export const cacheStrategies = {
  // Données statiques (rarement modifiées)
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
  },
  
  // Données fréquemment modifiées
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Données en temps réel
  realtime: {
    staleTime: 0, // Toujours stale
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30000, // Refetch toutes les 30 secondes
  },
  
  // Données utilisateur
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  
  // Analytics (peu fréquent)
  analytics: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Produits (cache agressif car changent peu)
  products: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },
  
  // Commandes (changements fréquents)
  orders: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Recherche (cache court car dépend de la requête)
  search: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Invalider le cache de manière intelligente
 */
export function invalidateCache(
  queryClient: QueryClient,
  queryKeys: string[][],
  options?: { exact?: boolean }
): void {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({
      queryKey: key,
      exact: options?.exact ?? false,
    });
  });
  
  logger.info('Cache invalidé', { queryKeys });
}

/**
 * Précharger des données importantes
 */
export function prefetchImportantData(queryClient: QueryClient): void {
  // Précharger les données utilisateur
  // Précharger les stores
  // Précharger les produits populaires
  
  logger.info('Préchargement des données importantes');
}

/**
 * Nettoyer le cache périodiquement
 * Amélioré avec nettoyage intelligent des données obsolètes
 */
export function setupCacheCleanup(queryClient: QueryClient, intervalMs: number = 600000): () => void {
  const cleanup = () => {
    // Nettoyer les queries inactives
    queryClient.removeQueries({
      predicate: (query) => {
        // Supprimer les queries inactives depuis plus de 1 heure
        const lastUsed = query.state.dataUpdatedAt;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return lastUsed < oneHourAgo;
      },
    });
    
    logger.debug('Cache nettoyé');
  };

  // Nettoyer immédiatement
  cleanup();
  
  // Puis nettoyer périodiquement
  const interval = setInterval(cleanup, intervalMs);
  
  return () => clearInterval(interval);
}

/**
 * Optimiser le cache localStorage
 */
export function optimizeLocalStorageCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const maxSize = 5 * 1024 * 1024; // 5MB
    let  totalSize= 0;
    
    // Calculer la taille totale
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    // Si le cache est trop volumineux, nettoyer les anciennes entrées
    if (totalSize > maxSize) {
      logger.warn('LocalStorage cache trop volumineux, nettoyage...', {
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        maxSize: `${(maxSize / 1024 / 1024).toFixed(2)} MB`,
      });
      
      // Supprimer les clés avec préfixe 'cache-' les plus anciennes
      const cacheKeys = keys
        .filter(key => key.startsWith('cache-'))
        .map(key => ({
          key,
          timestamp: parseInt(localStorage.getItem(`${key}-timestamp`) || '0'),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // Supprimer les 20% les plus anciennes
      const toRemove = Math.ceil(cacheKeys.length * 0.2);
      cacheKeys.slice(0, toRemove).forEach(({ key }) => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}-timestamp`);
      });
      
      logger.info('LocalStorage nettoyé', { removed: toRemove });
    }
  } catch (error) {
    logger.error('Erreur lors de l\'optimisation du cache localStorage', { error });
  }
}








