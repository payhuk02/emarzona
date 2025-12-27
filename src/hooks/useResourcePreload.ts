/**
 * Hook pour précharger les ressources critiques (images, fonts, etc.)
 * Améliore les Web Vitals (LCP) en préchargeant les ressources above-the-fold
 * 
 * @example
 * ```tsx
 * useResourcePreload({
 *   images: ['/logo.png', '/hero-image.jpg'],
 *   fonts: ['/fonts/inter.woff2'],
 *   scripts: ['/critical-script.js'],
 * });
 * ```
 */

import { useEffect } from 'react';

interface ResourcePreloadOptions {
  /**
   * URLs d'images à précharger
   */
  images?: string[];
  /**
   * URLs de fonts à précharger
   */
  fonts?: string[];
  /**
   * URLs de scripts à précharger
   */
  scripts?: string[];
  /**
   * URLs de styles à précharger
   */
  styles?: string[];
  /**
   * Délai avant de commencer le preload (ms)
   * @default 0
   */
  delay?: number;
  /**
   * Activer le preload uniquement si la connexion est rapide
   * @default true
   */
  onlyOnFastConnection?: boolean;
}

/**
 * Vérifie si la connexion est rapide
 */
function isFastConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return true; // Par défaut, considérer comme rapide
  }
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!connection) return true;
  
  // Considérer comme rapide si 4G ou mieux
  const effectiveType = connection.effectiveType;
  return effectiveType === '4g' || effectiveType === '5g';
}

/**
 * Crée un élément link de preload
 */
function createPreloadLink(
  href: string,
  as: 'image' | 'font' | 'script' | 'style' | 'fetch',
  type?: string
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) {
    link.type = type;
  }
  
  // Ajouter crossorigin pour les fonts
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  return link;
}

/**
 * Hook pour précharger les ressources critiques
 */
export function useResourcePreload(options: ResourcePreloadOptions = {}) {
  const {
    images = [],
    fonts = [],
    scripts = [],
    styles = [],
    delay = 0,
    onlyOnFastConnection = true,
  } = options;

  useEffect(() => {
    // Vérifier la connexion si nécessaire
    if (onlyOnFastConnection && !isFastConnection()) {
      return; // Ne pas preload sur connexion lente
    }

    const timeoutId = delay > 0 ? setTimeout(() => {
      preloadResources();
    }, delay) : null;

    if (delay === 0) {
      preloadResources();
    }

    function preloadResources() {
      // Preload images
      images.forEach(imageUrl => {
        try {
          const link = createPreloadLink(imageUrl, 'image');
          document.head.appendChild(link);
        } catch (error) {
          // Ignorer les erreurs
        }
      });

      // Preload fonts
      fonts.forEach(fontUrl => {
        try {
          const link = createPreloadLink(fontUrl, 'font');
          // Déterminer le type de font
          if (fontUrl.endsWith('.woff2')) {
            link.type = 'font/woff2';
          } else if (fontUrl.endsWith('.woff')) {
            link.type = 'font/woff';
          } else if (fontUrl.endsWith('.ttf')) {
            link.type = 'font/ttf';
          }
          document.head.appendChild(link);
        } catch (error) {
          // Ignorer les erreurs
        }
      });

      // Preload scripts
      scripts.forEach(scriptUrl => {
        try {
          const link = createPreloadLink(scriptUrl, 'script', 'application/javascript');
          document.head.appendChild(link);
        } catch (error) {
          // Ignorer les erreurs
        }
      });

      // Preload styles
      styles.forEach(styleUrl => {
        try {
          const link = createPreloadLink(styleUrl, 'style', 'text/css');
          document.head.appendChild(link);
        } catch (error) {
          // Ignorer les erreurs
        }
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [images, fonts, scripts, styles, delay, onlyOnFastConnection]);
}







