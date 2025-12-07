/**
 * Hook useTimeout - Gérer les timeouts
 * Fournit une API simple pour créer et nettoyer des timeouts
 * 
 * @example
 * ```tsx
 * const [showMessage, setShowMessage] = useState(false);
 * 
 * useTimeout(() => {
 *   setShowMessage(true);
 * }, 3000);
 * ```
 */

import { useEffect, useRef } from 'react';

export interface UseTimeoutOptions {
  /**
   * Délai en millisecondes
   */
  delay: number | null;
  /**
   * Callback à exécuter
   */
  callback: () => void;
}

/**
 * Hook pour gérer les timeouts
 */
export function useTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef<() => void>();

  // Sauvegarder le callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurer le timeout
  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearTimeout(id);
  }, [delay]);
}

