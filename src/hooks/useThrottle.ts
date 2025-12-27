/**
 * Hook useThrottle - Throttle une valeur ou une fonction
 * Limite l'exécution d'une fonction à un certain intervalle
 * 
 * @example
 * ```tsx
 * const throttledValue = useThrottle(value, 1000);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour throttler une valeur
 */
export function useThrottle<T>(value: T, delay: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook pour throttler une fonction callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (Date.now() - lastRan.current));
      }
    },
    [callback, delay]
  ) as T;

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Hook pour throttler une fonction avec leading et trailing
 */
export function useThrottledCallbackAdvanced<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastArgsRef = useRef<Parameters<T>>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      const now = Date.now();
      const timeSinceLastRun = now - lastRan.current;

      if (timeSinceLastRun >= delay) {
        // Exécuter immédiatement si leading est activé
        if (leading) {
          callback(...args);
          lastRan.current = now;
        }
      } else {
        // Programmer l'exécution trailing si activé
        if (trailing) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current);
              lastRan.current = Date.now();
            }
          }, delay - timeSinceLastRun);
        }
      }
    },
    [callback, delay, leading, trailing]
  ) as T;

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}







