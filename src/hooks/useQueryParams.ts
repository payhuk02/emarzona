/**
 * Hook useQueryParams - Gestion simplifiée des paramètres d'URL
 * Fournit une API simple pour lire et modifier les query parameters
 * 
 * @example
 * ```tsx
 * const { getParam, setParam, removeParam, getAllParams } = useQueryParams();
 * 
 * const page = getParam('page', '1');
 * setParam('page', '2');
 * ```
 */

import { useSearchParams, useLocation } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UseQueryParamsReturn {
  /**
   * Obtenir un paramètre
   */
  getParam: (key: string, defaultValue?: string) => string | null;
  /**
   * Définir un paramètre
   */
  setParam: (key: string, value: string | number | null) => void;
  /**
   * Supprimer un paramètre
   */
  removeParam: (key: string) => void;
  /**
   * Obtenir tous les paramètres
   */
  getAllParams: () => Record<string, string>;
  /**
   * Obtenir un paramètre comme nombre
   */
  getParamAsNumber: (key: string, defaultValue?: number) => number | null;
  /**
   * Obtenir un paramètre comme booléen
   */
  getParamAsBoolean: (key: string, defaultValue?: boolean) => boolean;
  /**
   * Définir plusieurs paramètres à la fois
   */
  setParams: (params: Record<string, string | number | null>) => void;
  /**
   * Supprimer plusieurs paramètres
   */
  removeParams: (keys: string[]) => void;
  /**
   * Réinitialiser tous les paramètres
   */
  clearParams: () => void;
}

/**
 * Hook pour gérer les query parameters
 */
export function useQueryParams(): UseQueryParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getParam = useCallback(
    (key: string, defaultValue?: string): string | null => {
      return searchParams.get(key) ?? defaultValue ?? null;
    },
    [searchParams]
  );

  const getParamAsNumber = useCallback(
    (key: string, defaultValue?: number): number | null => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue ?? null;
      const num = Number(value);
      return isNaN(num) ? (defaultValue ?? null) : num;
    },
    [searchParams]
  );

  const getParamAsBoolean = useCallback(
    (key: string, defaultValue: boolean = false): boolean => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      return value === 'true' || value === '1';
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string | number | null) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
        return newParams;
      });
    },
    [setSearchParams]
  );

  const removeParam = useCallback(
    (key: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(key);
        return newParams;
      });
    },
    [setSearchParams]
  );

  const setParams = useCallback(
    (params: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        Object.entries(params).forEach(([key, value]) => {
          if (value === null || value === '') {
            newParams.delete(key);
          } else {
            newParams.set(key, String(value));
          }
        });
        return newParams;
      });
    },
    [setSearchParams]
  );

  const removeParams = useCallback(
    (keys: string[]) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        keys.forEach((key) => {
          newParams.delete(key);
        });
        return newParams;
      });
    },
    [setSearchParams]
  );

  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    getParam,
    setParam,
    removeParam,
    getAllParams,
    getParamAsNumber,
    getParamAsBoolean,
    setParams,
    removeParams,
    clearParams,
  };
}

/**
 * Hook pour gérer un paramètre spécifique
 */
export function useQueryParam<T extends string | number = string>(
  key: string,
  defaultValue?: T
): [T | null, (value: T | null) => void] {
  const { getParam, setParam } = useQueryParams();

  const value = useMemo(() => {
    const param = getParam(key);
    if (param === null) return (defaultValue ?? null) as T | null;
    if (typeof defaultValue === 'number') {
      return (Number(param) as T) || (defaultValue as T);
    }
    return param as T;
  }, [getParam, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T | null) => {
      setParam(key, newValue === null ? null : String(newValue));
    },
    [setParam, key]
  );

  return [value, setValue];
}

