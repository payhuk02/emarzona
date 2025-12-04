/**
 * Hook pour stabiliser la position des dropdowns/menus sur mobile
 * Empêche le repositionnement lors des interactions
 */

import { useEffect, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface UseStableDropdownPositionOptions {
  /**
   * Si le menu est ouvert
   */
  open: boolean;
  /**
   * Référence vers l'élément du menu
   */
  menuRef: React.RefObject<HTMLElement>;
  /**
   * Délai avant de verrouiller la position (ms)
   * Par défaut: 100ms pour laisser Radix UI positionner le menu
   */
  lockDelay?: number;
}

/**
 * Hook pour stabiliser la position d'un dropdown sur mobile
 * 
 * @example
 * const menuRef = useRef<HTMLDivElement>(null);
 * useStableDropdownPosition({ open, menuRef });
 */
export function useStableDropdownPosition({
  open,
  menuRef,
  lockDelay = 100,
}: UseStableDropdownPositionOptions) {
  const isMobile = useIsMobile();
  const savedPositionRef = useRef<{ top: number; left: number; width: number } | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (!open || !isMobile || !menuRef.current) {
      // Nettoyer lors de la fermeture
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      savedPositionRef.current = null;
      isLockedRef.current = false;
      return;
    }

    const menu = menuRef.current;
    let timeoutId: NodeJS.Timeout;

    // Fonction pour restaurer la position
    const restorePosition = () => {
      if (!menu || !savedPositionRef.current || !isLockedRef.current) return;

      const currentRect = menu.getBoundingClientRect();

      // Si la position a changé de manière significative (> 1px), la restaurer
      if (
        Math.abs(currentRect.top - savedPositionRef.current.top) > 1 ||
        Math.abs(currentRect.left - savedPositionRef.current.left) > 1
      ) {
        // Restaurer la position sauvegardée avec !important via style inline
        menu.style.setProperty('position', 'fixed', 'important');
        menu.style.setProperty('top', `${savedPositionRef.current.top}px`, 'important');
        menu.style.setProperty('left', `${savedPositionRef.current.left}px`, 'important');
        menu.style.setProperty('width', `${savedPositionRef.current.width}px`, 'important');
        menu.style.setProperty('transform', 'none', 'important');
        menu.style.setProperty('margin', '0', 'important');
        menu.style.setProperty('will-change', 'auto', 'important');
      }
    };

    // Attendre que le menu soit positionné par Radix UI
    timeoutId = setTimeout(() => {
      const rect = menu.getBoundingClientRect();

      // Si le menu a une position valide, la sauvegarder et verrouiller
      if (rect.top > 0 && rect.left > 0 && rect.width > 0) {
        savedPositionRef.current = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
        };
        isLockedRef.current = true;

        // Verrouiller immédiatement la position
        menu.style.setProperty('position', 'fixed', 'important');
        menu.style.setProperty('top', `${rect.top}px`, 'important');
        menu.style.setProperty('left', `${rect.left}px`, 'important');
        menu.style.setProperty('width', `${rect.width}px`, 'important');
        menu.style.setProperty('transform', 'none', 'important');
        menu.style.setProperty('margin', '0', 'important');

        // Surveiller avec requestAnimationFrame pour une réactivité maximale
        const checkPosition = () => {
          if (isLockedRef.current && menu && savedPositionRef.current) {
            restorePosition();
            rafRef.current = requestAnimationFrame(checkPosition);
          }
        };
        rafRef.current = requestAnimationFrame(checkPosition);

        // Créer un observer pour surveiller les changements de position
        observerRef.current = new MutationObserver(() => {
          if (isLockedRef.current && menu && savedPositionRef.current) {
            restorePosition();
          }
        });

        // Observer les changements dans le DOM qui pourraient affecter la position
        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class'],
        });

        // Observer aussi les changements d'attributs sur le menu lui-même
        if (menu.parentElement) {
          observerRef.current.observe(menu.parentElement, {
            attributes: true,
            attributeFilter: ['style', 'class'],
          });
        }

        // Observer le menu directement
        observerRef.current.observe(menu, {
          attributes: true,
          attributeFilter: ['style', 'class', 'data-state'],
        });
      }
    }, lockDelay);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      savedPositionRef.current = null;
      isLockedRef.current = false;
    };
  }, [open, isMobile, menuRef, lockDelay]);
}

