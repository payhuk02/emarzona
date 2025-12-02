/**
 * Hook pour le prefetching intelligent des routes et données
 * Améliore les performances en préchargeant les ressources fréquemment utilisées
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface PrefetchOptions {
  /**
   * Routes à prefetch au hover des liens
   */
  routes?: string[];
  
  /**
   * Query keys à prefetch
   */
  queries?: Array<{
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
  }>;
  
  /**
   * Délai avant prefetch (ms)
   */
  delay?: number;
}

/**
 * Hook pour prefetch les routes fréquentes
 */
export const usePrefetchRoutes = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    // Routes fréquentes à prefetch (priorisées par usage)
    const frequentRoutes = [
      '/dashboard',
      '/dashboard/products',
      '/dashboard/orders',
      '/dashboard/analytics',
      '/marketplace',
      '/cart',
      '/account',
    ];

    // Prefetch les routes au chargement de la page avec délai pour ne pas bloquer
    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    const prefetchRoutes = () => {
      frequentRoutes.forEach((route, index) => {
        if (route !== location.pathname) {
          // Délai progressif pour ne pas surcharger le réseau
          setTimeout(() => {
            // Créer un lien invisible pour prefetch
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            link.as = 'document';
            document.head.appendChild(link);
            logger.debug(`Prefetched route: ${route}`);
          }, index * 200); // 200ms entre chaque prefetch
        }
      });
    };

    // Utiliser requestIdleCallback si disponible (meilleure performance)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchRoutes, { timeout: 2000 });
    } else {
      // Fallback pour navigateurs sans support
      setTimeout(prefetchRoutes, 1000);
    }
  }, [location.pathname]);
};

/**
 * Hook pour prefetch les données au hover des liens
 * AMÉLIORÉ : Prefetch plus intelligent avec prefetch DNS et preconnect
 */
export const usePrefetchOnHover = (options: PrefetchOptions = {}) => {
  const queryClient = useQueryClient();
  const { routes = [], queries = [], delay = 100 } = options;

  useEffect(() => {
    const links = document.querySelectorAll('a[href]');
    const prefetchedRoutes = new Set<string>();
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = (event: Event) => {
      const link = event.currentTarget as HTMLAnchorElement;
      const href = link.getAttribute('href');
      
      if (!href) return;

      // Prefetch la route si elle est dans la liste
      if (routes.some(route => href.includes(route))) {
        timeoutId = setTimeout(() => {
          const routePath = href.startsWith('/') ? href : `/${href}`;
          
          // Éviter de prefetch plusieurs fois la même route
          if (prefetchedRoutes.has(routePath)) {
            return;
          }
          
          prefetchedRoutes.add(routePath);
          logger.debug(`Prefetching route: ${routePath}`);
          
          // Prefetch DNS pour les domaines externes si nécessaire
          const url = new URL(routePath, window.location.origin);
          if (url.origin !== window.location.origin) {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = url.origin;
            document.head.appendChild(link);
          }
          
          // Prefetch la route avec link prefetch
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = routePath;
          prefetchLink.as = 'document';
          document.head.appendChild(prefetchLink);
        }, delay);
      }
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    links.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
      link.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('mouseenter', handleMouseEnter);
        link.removeEventListener('mouseleave', handleMouseLeave);
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [routes, delay]);

  // Prefetch les queries
  useEffect(() => {
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });
  }, [queries, queryClient]);
};

/**
 * Hook pour prefetch les données critiques au démarrage
 * @param userId - ID de l'utilisateur connecté
 */
export const usePrefetchCriticalData = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Prefetch les données critiques
    logger.debug('Prefetching critical data for user', { userId });
    
    // Note: Implémentation complète nécessite les hooks/services appropriés
    // Exemple: queryClient.prefetchQuery(['store', userId], fetchStore);
  }, [userId, queryClient]);
};

/**
 * Hook principal pour le prefetching
 */
export const usePrefetch = (options?: PrefetchOptions) => {
  usePrefetchRoutes();
  usePrefetchOnHover(options);
};

