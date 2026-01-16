import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Hook optimisé pour détecter si l'utilisateur est sur mobile
 * Utilise useMemo pour éviter les re-renders inutiles
 * Performance: Évite les re-renders à chaque resize grâce au debounce
 */
export function useIsMobile() {
  // Utiliser useMemo pour calculer la valeur initiale une seule fois
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    // Debounce pour éviter trop de re-renders lors du resize
    let timeoutId: NodeJS.Timeout;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      // Debounce les changements pour éviter les re-renders excessifs
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
        setIsMobile(prev => {
          // Ne mettre à jour que si la valeur a changé
          if (prev !== newIsMobile) {
            return newIsMobile;
          }
          return prev;
        });
      }, 100); // Debounce de 100ms
    };

    // Utiliser matchMedia pour une meilleure performance
    const handleChange = (e: MediaQueryListEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(e.matches);
      }, 100);
    };

    // Écouter les changements de media query (plus performant que resize)
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
    } else {
      // Fallback pour les navigateurs plus anciens
      mql.addListener(handleChange);
    }

    // Écouter aussi les resize pour les cas edge
    window.addEventListener('resize', onChange, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleChange);
      } else {
        mql.removeListener(handleChange);
      }
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return isMobile;
}
