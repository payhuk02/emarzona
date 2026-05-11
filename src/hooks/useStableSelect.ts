/**
 * Hook pour stabiliser les menus de sélection pendant l'interaction
 * Empêche le menu de bouger ou de se fermer avant la sélection
 */

import { useEffect, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface UseStableSelectOptions {
  /**
   * Référence vers l'élément du menu (SelectContent ou DropdownMenuContent)
   */
  menuRef: React.RefObject<HTMLElement>;
  /**
   * État d'ouverture du menu
   */
  isOpen: boolean;
  /**
   * Callback appelé quand la position doit être verrouillée
   */
  onPositionLocked?: (position: { top: number; left: number; width: number }) => void;
}

/**
 * Hook pour stabiliser la position d'un menu de sélection
 * 
 * Sur mobile, verrouille la position du menu une fois ouvert pour éviter
 * qu'il bouge pendant l'interaction utilisateur.
 * 
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * useStableSelect({
 *   menuRef,
 *   isOpen,
 *   onPositionLocked: (pos) => {
 *     // Position verrouillée, menu stable
 *   }
 * });
 * ```
 */
export function useStableSelect({
  menuRef,
  isOpen,
  onPositionLocked,
}: UseStableSelectOptions) {
  const isMobile = useIsMobile();
  const lockedPositionRef = useRef<{ top: number; left: number; width: number } | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!isMobile || !isOpen || !menuRef.current) {
      lockedPositionRef.current = null;
      return;
    }

    const menuElement = menuRef.current;

    // Fonction pour verrouiller la position
    const lockPosition = () => {
      if (!menuElement) return;

      const rect = menuElement.getBoundingClientRect();
      const position = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
      };

      lockedPositionRef.current = position;
      onPositionLocked?.(position);

      // Forcer la position avec style inline
      menuElement.style.position = 'fixed';
      menuElement.style.top = `${position.top}px`;
      menuElement.style.left = `${position.left}px`;
      menuElement.style.width = `${position.width}px`;
    };

    // Attendre que le menu soit positionné par Radix UI
    // Utiliser requestAnimationFrame pour s'assurer que le positionnement initial est fait
    const timeoutId = setTimeout(() => {
      lockPosition();

      // Surveiller les changements de position avec MutationObserver
      observerRef.current = new MutationObserver(() => {
        if (lockedPositionRef.current && menuElement) {
          const currentRect = menuElement.getBoundingClientRect();
          const locked = lockedPositionRef.current;

          // Si la position a changé, la restaurer
          if (
            Math.abs(currentRect.top - locked.top) > 1 ||
            Math.abs(currentRect.left - locked.left) > 1
          ) {
            menuElement.style.top = `${locked.top}px`;
            menuElement.style.left = `${locked.left}px`;
          }
        }
      });

      // Observer les changements d'attributs de style
      observerRef.current.observe(menuElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: false,
        subtree: false,
      });
    }, 100); // Délai pour laisser Radix UI positionner le menu

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (menuElement) {
        // Restaurer les styles à la fermeture
        menuElement.style.position = '';
        menuElement.style.top = '';
        menuElement.style.left = '';
        menuElement.style.width = '';
      }
      lockedPositionRef.current = null;
    };
  }, [isMobile, isOpen, menuRef, onPositionLocked]);

  return {
    lockedPosition: lockedPositionRef.current,
  };
}







