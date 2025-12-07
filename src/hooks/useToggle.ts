/**
 * Hook useToggle - Gestion simplifiée des états toggle
 * Fournit une API simple pour gérer les états booléens
 * 
 * @example
 * ```tsx
 * const [isOpen, toggle, open, close] = useToggle(false);
 * 
 * <Button onClick={toggle}>Toggle</Button>
 * ```
 */

import { useState, useCallback } from 'react';

export interface UseToggleReturn {
  /**
   * Valeur actuelle
   */
  value: boolean;
  /**
   * Setter pour la valeur
   */
  setValue: (value: boolean | ((prev: boolean) => boolean)) => void;
  /**
   * Toggle la valeur
   */
  toggle: () => void;
  /**
   * Mettre à true
   */
  setTrue: () => void;
  /**
   * Mettre à false
   */
  setFalse: () => void;
}

/**
 * Hook pour gérer un état booléen avec toggle
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
  };
}

/**
 * Hook pour gérer plusieurs toggles
 */
export function useToggles<T extends Record<string, boolean>>(
  initialValues: T
): {
  values: T;
  setValue: <K extends keyof T>(key: K, value: boolean | ((prev: boolean) => boolean)) => void;
  toggle: <K extends keyof T>(key: K) => void;
  setTrue: <K extends keyof T>(key: K) => void;
  setFalse: <K extends keyof T>(key: K) => void;
  reset: () => void;
} {
  const [values, setValues] = useState<T>(initialValues);

  const setValue = useCallback(<K extends keyof T>(
    key: K,
    value: boolean | ((prev: boolean) => boolean)
  ) => {
    setValues((prev) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value,
    }));
  }, []);

  const toggle = useCallback(<K extends keyof T>(key: K) => {
    setValues((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setTrue = useCallback(<K extends keyof T>(key: K) => {
    setValues((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const setFalse = useCallback(<K extends keyof T>(key: K) => {
    setValues((prev) => ({
      ...prev,
      [key]: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    setValue,
    toggle,
    setTrue,
    setFalse,
    reset,
  };
}

