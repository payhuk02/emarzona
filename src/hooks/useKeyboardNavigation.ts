/**
 * useKeyboardNavigation Hook
 * Date: 28 Janvier 2025
 * 
 * Hook pour améliorer la navigation clavier dans les composants
 * Support des flèches, Tab, Enter, Escape, etc.
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  /**
   * Éléments focusables (sélecteur CSS ou refs)
   */
  focusableSelector?: string;
  /**
   * Activer la navigation avec les flèches
   */
  arrowNavigation?: boolean;
  /**
   * Activer la navigation circulaire (boucle)
   */
  circular?: boolean;
  /**
   * Orientation de la navigation (horizontal ou vertical)
   */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /**
   * Callback quand un élément est sélectionné
   */
  onSelect?: (index: number, element: HTMLElement) => void;
  /**
   * Index initial
   */
  initialIndex?: number;
  /**
   * Activer la navigation avec Home/End
   */
  homeEndNavigation?: boolean;
}

export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) {
  const {
    focusableSelector = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    arrowNavigation = true,
    circular = true,
    orientation = 'both',
    onSelect,
    initialIndex = 0,
    homeEndNavigation = true,
  } = options;

  const currentIndexRef = useRef<number>(initialIndex);
  const elementsRef = useRef<HTMLElement[]>([]);

  // Récupérer les éléments focusables
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.tabIndex !== -1 &&
        window.getComputedStyle(el).display !== 'none'
    );

    elementsRef.current = elements;
    return elements;
  }, [containerRef, focusableSelector]);

  // Focuser un élément par index
  const focusElement = useCallback(
    (index: number) => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      let targetIndex = index;
      if (circular) {
        targetIndex = ((index % elements.length) + elements.length) % elements.length;
      } else {
        targetIndex = Math.max(0, Math.min(index, elements.length - 1));
      }

      const element = elements[targetIndex];
      if (element) {
        element.focus();
        currentIndexRef.current = targetIndex;
        onSelect?.(targetIndex, element);
      }
    },
    [getFocusableElements, circular, onSelect]
  );

  // Navigation avec les flèches
  const handleArrowNavigation = useCallback(
    (e: KeyboardEvent, direction: 'up' | 'down' | 'left' | 'right') => {
      if (!arrowNavigation) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      let newIndex = currentIndexRef.current;

      if (orientation === 'horizontal' || orientation === 'both') {
        if (direction === 'left') {
          newIndex = currentIndexRef.current - 1;
        } else if (direction === 'right') {
          newIndex = currentIndexRef.current + 1;
        }
      }

      if (orientation === 'vertical' || orientation === 'both') {
        if (direction === 'up') {
          newIndex = currentIndexRef.current - 1;
        } else if (direction === 'down') {
          newIndex = currentIndexRef.current + 1;
        }
      }

      focusElement(newIndex);
    },
    [arrowNavigation, orientation, getFocusableElements, focusElement]
  );

  // Gestion des touches clavier
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      // Trouver l'index de l'élément actuellement focusé
      const currentElement = document.activeElement as HTMLElement;
      const currentIndex = elements.findIndex((el) => el === currentElement);
      if (currentIndex !== -1) {
        currentIndexRef.current = currentIndex;
      }

      switch (e.key) {
        case 'ArrowUp':
          handleArrowNavigation(e, 'up');
          break;
        case 'ArrowDown':
          handleArrowNavigation(e, 'down');
          break;
        case 'ArrowLeft':
          handleArrowNavigation(e, 'left');
          break;
        case 'ArrowRight':
          handleArrowNavigation(e, 'right');
          break;
        case 'Home':
          if (homeEndNavigation) {
            e.preventDefault();
            focusElement(0);
          }
          break;
        case 'End':
          if (homeEndNavigation) {
            e.preventDefault();
            focusElement(elements.length - 1);
          }
          break;
        default:
          break;
      }
    },
    [getFocusableElements, handleArrowNavigation, homeEndNavigation, focusElement]
  );

  // Initialiser la navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialiser avec le premier élément si spécifié
    if (initialIndex >= 0) {
      const elements = getFocusableElements();
      if (elements[initialIndex]) {
        elements[initialIndex].focus();
        currentIndexRef.current = initialIndex;
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, handleKeyDown, initialIndex, getFocusableElements]);

  return {
    focusElement,
    getFocusableElements,
    currentIndex: currentIndexRef.current,
  };
}
