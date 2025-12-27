/**
 * Hook optimisé pour debounce avec cache et optimisations
 * Améliore les performances des recherches et filtres
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseOptimizedDebounceOptions {
  /**
   * Délai de debounce en millisecondes
   * @default 300
   */
  delay?: number;
  
  /**
   * Délai minimum avant de déclencher (pour éviter trop de requêtes)
   * @default 100
   */
  minDelay?: number;
  
  /**
   * Utiliser le cache React Query pour éviter les requêtes identiques
   * @default true
   */
  useCache?: boolean;
  
  /**
   * Callback appelé avec la valeur debouncée
   */
  onDebounce?: (value: string) => void;
}

/**
 * Hook optimisé pour debounce avec cache intelligent
 * 
 * @example
 * ```tsx
 * const [search, debouncedSearch] = useOptimizedDebounce('', {
 *   delay: 500,
 *   onDebounce: (value) => {
 *     // Requête API seulement si valeur changée
 *   }
 * });
 * ```
 */
export function useOptimizedDebounce(
  initialValue: string = '',
  options: UseOptimizedDebounceOptions = {}
): [string, string, (value: string) => void] {
  const {
    delay = 300,
    minDelay = 100,
    useCache = true,
    onDebounce,
  } = options;

  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDebouncedRef = useRef<string>(initialValue);
  const minDelayTimeoutRef = useRef<NodeJS.Timeout>();

  // Nettoyer les timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minDelayTimeoutRef.current) {
      clearTimeout(minDelayTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    // Nettoyer les timeouts précédents
    clearTimeouts();

    // Si la valeur n'a pas changé, ne rien faire
    if (value === lastDebouncedRef.current) {
      return;
    }

    // Délai minimum avant de commencer le debounce
    minDelayTimeoutRef.current = setTimeout(() => {
      // Vérifier le cache React Query si activé
      if (useCache && value.trim()) {
        const cacheKey = ['debounced-search', value];
        const cachedData = queryClient.getQueryData(cacheKey);
        
        if (cachedData) {
          // Utiliser la valeur en cache immédiatement
          setDebouncedValue(value);
          lastDebouncedRef.current = value;
          onDebounce?.(value);
          return;
        }
      }

      // Debounce normal
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastDebouncedRef.current = value;
        onDebounce?.(value);
      }, delay);
    }, minDelay);

    return clearTimeouts;
  }, [value, delay, minDelay, useCache, queryClient, onDebounce, clearTimeouts]);

  // Nettoyer à la destruction
  useEffect(() => {
    return clearTimeouts;
  }, [clearTimeouts]);

  const setValueOptimized = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return [value, debouncedValue, setValueOptimized];
}

/**
 * Hook pour debounce multiple valeurs simultanément
 * Utile pour les filtres complexes
 */
export function useMultipleDebounce<T extends Record<string, any>>(
  initialValues: T,
  delay: number = 300
): [T, T, (updates: Partial<T>) => void] {
  const [values, setValues] = useState<T>(initialValues);
  const [debouncedValues, setDebouncedValues] = useState<T>(initialValues);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValues(values);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [values, delay]);

  const updateValues = useCallback((updates: Partial<T>) => {
    setValues(prev => ({ ...prev, ...updates }));
  }, []);

  return [values, debouncedValues, updateValues];
}







