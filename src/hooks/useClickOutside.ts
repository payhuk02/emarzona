/**
 * Hook useClickOutside - Détecte les clics en dehors d'un élément
 * Utile pour fermer des dropdowns, modales, etc.
 * 
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 * ```
 */

import { useEffect, RefObject } from 'react';

export interface UseClickOutsideOptions {
  /**
   * Événement à écouter ('mousedown' | 'click' | 'touchstart')
   * @default 'mousedown'
   */
  event?: 'mousedown' | 'click' | 'touchstart';
  /**
   * Activer/désactiver le hook
   * @default true
   */
  enabled?: boolean;
  /**
   * Éléments à exclure (sélecteurs CSS ou refs)
   */
  exclude?: (string | RefObject<HTMLElement>)[];
}

/**
 * Hook pour détecter les clics en dehors d'un élément
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
) {
  const { event = 'mousedown', enabled = true, exclude = [] } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Vérifier si le clic est dans l'élément
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // Vérifier les exclusions
      for (const exclusion of exclude) {
        if (typeof exclusion === 'string') {
          const element = document.querySelector(exclusion);
          if (element && element.contains(target)) {
            return;
          }
        } else if (exclusion.current && exclusion.current.contains(target)) {
          return;
        }
      }

      // Appeler le handler
      handler(event);
    };

    document.addEventListener(event, handleClickOutside);

    return () => {
      document.removeEventListener(event, handleClickOutside);
    };
  }, [ref, handler, event, enabled, exclude]);
}

/**
 * Hook pour détecter les clics en dehors de plusieurs éléments
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
) {
  const { event = 'mousedown', enabled = true, exclude = [] } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Vérifier si le clic est dans l'un des éléments
      const isInsideAny = refs.some((ref) => ref.current && ref.current.contains(target));
      if (isInsideAny) {
        return;
      }

      // Vérifier les exclusions
      for (const exclusion of exclude) {
        if (typeof exclusion === 'string') {
          const element = document.querySelector(exclusion);
          if (element && element.contains(target)) {
            return;
          }
        } else if (exclusion.current && exclusion.current.contains(target)) {
          return;
        }
      }

      // Appeler le handler
      handler(event);
    };

    document.addEventListener(event, handleClickOutside);

    return () => {
      document.removeEventListener(event, handleClickOutside);
    };
  }, [refs, handler, event, enabled, exclude]);
}







