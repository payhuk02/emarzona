/**
 * Hook useInterval - Gérer les intervalles
 * Fournit une API simple pour créer et nettoyer des intervalles
 * 
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * 
 * useInterval(() => {
 *   setCount(c => c + 1);
 * }, 1000);
 * ```
 */

import { useEffect, useRef } from 'react';

export interface UseIntervalOptions {
  /**
   * Délai en millisecondes
   */
  delay: number | null;
  /**
   * Callback à exécuter
   */
  callback: () => void;
  /**
   * Exécuter immédiatement au montage
   * @default false
   */
  immediate?: boolean;
}

/**
 * Hook pour gérer les intervalles
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  immediate: boolean = false
): void {
  const savedCallback = useRef<() => void>();

  // Sauvegarder le callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurer l'intervalle
  useEffect(() => {
    if (delay === null) return;

    // Exécuter immédiatement si demandé
    if (immediate) {
      savedCallback.current?.();
    }

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearInterval(id);
  }, [delay, immediate]);
}

