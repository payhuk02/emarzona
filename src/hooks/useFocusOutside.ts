/**
 * Hook useFocusOutside - Détecte quand le focus sort d'un élément
 * Utile pour fermer des dropdowns, modales, etc. lors de la navigation clavier
 * 
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useFocusOutside(ref, () => setIsOpen(false));
 * ```
 */

import { useEffect, RefObject } from 'react';

export interface UseFocusOutsideOptions {
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
 * Hook pour détecter quand le focus sort d'un élément
 */
export function useFocusOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: FocusEvent) => void,
  options: UseFocusOutsideOptions = {}
) {
  const { enabled = true, exclude = [] } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleFocusOutside = (event: FocusEvent) => {
      const target = event.target as Node;

      // Vérifier si le focus est dans l'élément
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

    // Utiliser focusin pour capturer les événements de focus (bubbling)
    document.addEventListener('focusin', handleFocusOutside);

    return () => {
      document.removeEventListener('focusin', handleFocusOutside);
    };
  }, [ref, handler, enabled, exclude]);
}

/**
 * Hook pour détecter quand le focus sort de plusieurs éléments
 */
export function useFocusOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: FocusEvent) => void,
  options: UseFocusOutsideOptions = {}
) {
  const { enabled = true, exclude = [] } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleFocusOutside = (event: FocusEvent) => {
      const target = event.target as Node;

      // Vérifier si le focus est dans l'un des éléments
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

    document.addEventListener('focusin', handleFocusOutside);

    return () => {
      document.removeEventListener('focusin', handleFocusOutside);
    };
  }, [refs, handler, enabled, exclude]);
}

