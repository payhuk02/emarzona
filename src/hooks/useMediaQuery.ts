/**
 * Hook useMediaQuery - Gestion réutilisable des media queries
 * Simplifie l'utilisation des media queries dans les composants React
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Hook pour utiliser une media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Support pour les navigateurs modernes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback pour les navigateurs plus anciens
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Hook pour détecter si on est sur mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Hook pour détecter si on est sur tablette
 */
export function useIsTablet(minBreakpoint: number = 768, maxBreakpoint: number = 1024): boolean {
  return useMediaQuery(`(min-width: ${minBreakpoint}px) and (max-width: ${maxBreakpoint - 1}px)`);
}

/**
 * Hook pour détecter si on est sur desktop
 */
export function useIsDesktop(breakpoint: number = 1024): boolean {
  return useMediaQuery(`(min-width: ${breakpoint}px)`);
}

/**
 * Hook pour détecter le thème système (dark/light)
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook pour détecter la préférence de mouvement réduit
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook pour détecter la préférence de contraste élevé
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

/**
 * Hook pour obtenir plusieurs media queries à la fois
 */
export function useMediaQueries(queries: Record<string, string>): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  for (const [key, query] of Object.entries(queries)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useMediaQuery(query);
  }

  return results;
}

/**
 * Hook pour obtenir le breakpoint actuel
 */
export function useBreakpoint(breakpoints: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}): string | null {
  const [breakpoint, setBreakpoint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      for (const [name, value] of sortedBreakpoints) {
        if (width >= value) {
          setBreakpoint(name);
          return;
        }
      }
      setBreakpoint(null);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, [breakpoints]);

  return breakpoint;
}

