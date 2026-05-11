/**
 * Hook usePrevious - Obtenir la valeur précédente
 * Fournit une API simple pour comparer les valeurs précédentes
 * 
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 * 
 * // prevCount sera undefined au premier render, puis la valeur précédente
 * ```
 */

import { useRef, useEffect } from 'react';

/**
 * Hook pour obtenir la valeur précédente d'une variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}







