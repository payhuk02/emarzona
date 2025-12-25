/**
 * Système de prefetching intelligent
 * Précharge les ressources avant qu'elles ne soient nécessaires
 */

import { logger } from './logger';

interface PrefetchOptions {
  priority?: 'high' | 'low' | 'auto';
  as?: 'document' | 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Précharger une URL
 */
export function prefetchURL(url: string, options: PrefetchOptions = {}): void {
  if (!('IntersectionObserver' in window)) {
    return; // Skip si pas de support
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  
  if (options.as) {
    link.as = options.as;
  }
  
  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }
  
  document.head.appendChild(link);
  logger.debug('URL prefetched', { url });
}

/**
 * Précharger plusieurs URLs
 */
export function prefetchURLs(urls: string[], options?: PrefetchOptions): void {
  urls.forEach((url) => prefetchURL(url, options));
}

/**
 * Préconnexion à un domaine
 */
export function preconnect(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
  logger.debug('Domain preconnected', { url });
}

/**
 * DNS Prefetch
 */
export function dnsPrefetch(url: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
  logger.debug('DNS prefetch domain', { url });
}

/**
 * Précharger les routes au hover
 */
export function prefetchOnHover(selector: string): () => void {
  const links = document.querySelectorAll<HTMLAnchorElement>(selector);
  const prefetched = new Set<string>();

  const handleMouseEnter = (event: Event) => {
    const target = event.currentTarget as HTMLAnchorElement;
    const url = target.href;

    if (!prefetched.has(url)) {
      prefetchURL(url, { as: 'document' });
      prefetched.add(url);
    }
  };

  links.forEach((link) => {
    link.addEventListener('mouseenter', handleMouseEnter, { once: true });
  });

  // Cleanup
  return () => {
    links.forEach((link) => {
      link.removeEventListener('mouseenter', handleMouseEnter);
    });
  };
}

/**
 * Précharger les routes au viewport
 */
export function prefetchOnViewport(selector: string): IntersectionObserver {
  const prefetched = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLAnchorElement;
          const url = target.href;

          if (!prefetched.has(url)) {
            prefetchURL(url, { as: 'document' });
            prefetched.add(url);
            observer.unobserve(target);
          }
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  const links = document.querySelectorAll<HTMLAnchorElement>(selector);
  links.forEach((link) => observer.observe(link));

  return observer;
}

/**
 * Précharger les images au viewport
 */
export function prefetchImagesOnViewport(selector: string = 'img[data-src]'): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '100px',
    }
  );

  const images = document.querySelectorAll<HTMLImageElement>(selector);
  images.forEach((img) => observer.observe(img));

  return observer;
}

/**
 * Précharger les ressources critiques
 */
export function prefetchCriticalResources(): void {
  // API endpoints critiques
  const criticalEndpoints = [
    '/api/user',
    '/api/products',
    '/api/cart',
  ];

  criticalEndpoints.forEach((endpoint) => {
    prefetchURL(endpoint, { as: 'fetch' });
  });

  // Domaines externes critiques
  const externalDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  externalDomains.forEach((domain) => {
    preconnect(domain);
  });

  // API Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    preconnect(supabaseUrl);
    dnsPrefetch(supabaseUrl);
  }
}

/**
 * Précharger intelligemment selon la connexion
 */
export function smartPrefetch(urls: string[]): void {
  // Vérifier le type de connexion
  type NavigatorWithConnection = typeof navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  type NetworkInformation = {
    effectiveType?: '2g' | '3g' | '4g' | 'wifi';
    saveData?: boolean;
  };
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) {
    // Si pas d'info de connexion, précharger normalement
    prefetchURLs(urls);
    return;
  }

  // Ne précharger que sur connexion rapide
  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;

  if (saveData) {
    logger.debug('Save data mode enabled, skipping prefetch');
    return;
  }

  if (effectiveType === '4g' || effectiveType === 'wifi') {
    logger.debug('Fast connection detected, prefetching', { count: urls.length });
    prefetchURLs(urls);
  } else {
    logger.debug('Slow connection detected, skipping prefetch');
  }
}

/**
 * Précharger les routes React Router
 */
export function prefetchRoute(route: string): void {
  // Utiliser l'API History pour précharger
  if ('history' in window) {
    prefetchURL(route, { as: 'document', priority: 'low' });
  }
}

/**
 * Précharger automatiquement les liens visibles
 */
export function autoPrefetchLinks(): () => void {
  const cleanupHover = prefetchOnHover('a[href^="/"]');
  const observerViewport = prefetchOnViewport('a[href^="/"]');

  return () => {
    cleanupHover();
    observerViewport.disconnect();
  };
}

/**
 * Hook pour le prefetching automatique
 */
export function setupAutoPrefetch(): () => void {
  // Précharger les ressources critiques immédiatement
  prefetchCriticalResources();

  // Configurer le prefetch automatique après le chargement
  if (document.readyState === 'complete') {
    return autoPrefetchLinks();
  } else {
    window.addEventListener('load', autoPrefetchLinks, { once: true });
    return () => {};
  }
}

