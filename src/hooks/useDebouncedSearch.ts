/**
 * useDebouncedSearch Hook
 * Date: 28 Janvier 2025
 * 
 * Hook spécialisé pour les recherches avec debouncing et indicateur de chargement
 * Améliore l'UX et réduit les appels API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

export interface UseDebouncedSearchOptions {
  /**
   * Délai de debounce en millisecondes
   */
  debounceMs?: number;
  /**
   * Valeur initiale
   */
  initialValue?: string;
  /**
   * Callback appelé quand la recherche change
   */
  onSearchChange?: (value: string) => void;
  /**
   * Minimum de caractères avant de déclencher la recherche
   */
  minLength?: number;
}

export interface UseDebouncedSearchReturn {
  /**
   * Valeur de l'input (non debounced)
   */
  inputValue: string;
  /**
   * Valeur debounced
   */
  debouncedValue: string;
  /**
   * Indique si la recherche est en cours (inputValue !== debouncedValue)
   */
  isSearching: boolean;
  /**
   * Mettre à jour la valeur de l'input
   */
  setInputValue: (value: string) => void;
  /**
   * Réinitialiser la recherche
   */
  reset: () => void;
  /**
   * Vérifier si la recherche est valide (minLength respecté)
   */
  isValid: boolean;
}

/**
 * Hook pour gérer les recherches avec debouncing
 */
export function useDebouncedSearch(
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn {
  const {
    debounceMs = 500,
    initialValue = '',
    onSearchChange,
    minLength = 0,
  } = options;

  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const previousDebouncedValue = useRef(debouncedValue);

  // Indicateur de recherche en cours
  const isSearching = inputValue !== debouncedValue;

  // Appeler le callback quand la valeur debounced change
  useEffect(() => {
    if (debouncedValue !== previousDebouncedValue.current) {
      previousDebouncedValue.current = debouncedValue;
      
      if (onSearchChange) {
        onSearchChange(debouncedValue);
      }
    }
  }, [debouncedValue, onSearchChange]);

  // Réinitialiser
  const reset = useCallback(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Vérifier si la recherche est valide
  const isValid = debouncedValue.length >= minLength;

  return {
    inputValue,
    debouncedValue,
    isSearching,
    setInputValue,
    reset,
    isValid,
  };
}

