/**
 * Hook de debouncing pour optimiser les appels API
 * Retarde l'exécution d'une fonction jusqu'à ce que l'utilisateur arrête de taper
 */

import { useEffect, useState } from 'react';

/**
 * Debounce une valeur
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut 500ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debouncée après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si value change avant la fin du délai
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce une fonction callback
 * Utile pour les événements comme onChange, onScroll, etc.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Nettoyer le timeout au démontage du composant
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    // Annuler le timeout précédent
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Créer un nouveau timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

