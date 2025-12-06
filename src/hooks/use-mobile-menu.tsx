/**
 * Hook pour gérer les menus sur mobile de manière stable et fluide
 * Résout les problèmes de positionnement, scroll, et interactions tactiles
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface UseMobileMenuOptions {
  /**
   * Référence vers l'élément du menu
   */
  menuRef: React.RefObject<HTMLElement>;
  /**
   * État d'ouverture du menu
   */
  isOpen: boolean;
  /**
   * Référence vers le bouton trigger (optionnel)
   */
  triggerRef?: React.RefObject<HTMLElement>;
  /**
   * Délai avant de verrouiller la position (ms)
   */
  lockDelay?: number;
  /**
   * Padding de collision avec les bords de l'écran
   */
  collisionPadding?: number;
  /**
   * Z-index du menu
   */
  zIndex?: number;
}

interface UseMobileMenuReturn {
  /**
   * Styles à appliquer au menu pour le verrouillage
   */
  lockStyles: React.CSSProperties | undefined;
  /**
   * Callback pour verrouiller la position
   */
  lockPosition: () => void;
  /**
   * Callback pour déverrouiller la position
   */
  unlockPosition: () => void;
  /**
   * Indique si la position est verrouillée
   */
  isLocked: boolean;
}

/**
 * Hook pour gérer le positionnement stable des menus sur mobile
 */
export function useMobileMenu({
  menuRef,
  isOpen,
  triggerRef,
  lockDelay = 150,
  collisionPadding = 8,
  zIndex = 100,
}: UseMobileMenuOptions): UseMobileMenuReturn {
  const isMobile = useIsMobile();
  const [isLocked, setIsLocked] = useState(false);
  const positionRef = useRef<{ top: number; left: number; width: number; height: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateOptimalPosition = useCallback((): { top: number; left: number; width: number; height: number } | null => {
    if (!menuRef.current) return null;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();

    // Vérifier que le menu est rendu
    if (rect.width === 0 || rect.height === 0) return null;

    let finalTop = rect.top;
    let finalLeft = rect.left;
    const savedWidth = rect.width;
    const savedHeight = rect.height;

    // Si on a une référence au trigger, calculer la position optimale
    if (triggerRef?.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      
      // Positionner le menu juste en dessous du trigger
      finalTop = triggerRect.bottom + 4;
      finalLeft = triggerRect.right - savedWidth; // Aligné à droite par défaut
      
      // Ajuster pour rester dans les limites de l'écran
      if (finalLeft < collisionPadding) {
        finalLeft = collisionPadding;
      }
      if (finalLeft + savedWidth > window.innerWidth - collisionPadding) {
        finalLeft = window.innerWidth - savedWidth - collisionPadding;
      }
      
      // Si le menu dépasse en bas, l'afficher au-dessus
      if (finalTop + savedHeight > window.innerHeight - collisionPadding) {
        finalTop = triggerRect.top - savedHeight - 4;
      }
      
      // Si le menu dépasse en haut, le centrer verticalement
      if (finalTop < collisionPadding) {
        finalTop = Math.max(collisionPadding, (window.innerHeight - savedHeight) / 2);
      }
    } else {
      // Fallback : ajuster la position actuelle pour rester dans les limites
      if (finalLeft < collisionPadding) finalLeft = collisionPadding;
      if (finalLeft + savedWidth > window.innerWidth - collisionPadding) {
        finalLeft = window.innerWidth - savedWidth - collisionPadding;
      }
      if (finalTop < collisionPadding) finalTop = collisionPadding;
      if (finalTop + savedHeight > window.innerHeight - collisionPadding) {
        finalTop = window.innerHeight - savedHeight - collisionPadding;
      }
    }

    return { top: finalTop, left: finalLeft, width: savedWidth, height: savedHeight };
  }, [menuRef, triggerRef, collisionPadding]);

  const lockPosition = useCallback(() => {
    if (!isMobile || !menuRef.current) return;

    const position = calculateOptimalPosition();
    if (!position) return;

    positionRef.current = position;
    setIsLocked(true);

    const menu = menuRef.current;
    const { top, left, width, height } = position;

    // Appliquer les styles de verrouillage
    // IMPORTANT: Ne pas utiliser touch-action: none car cela bloque les interactions
    menu.style.cssText = `
      position: fixed !important;
      top: ${top}px !important;
      left: ${left}px !important;
      width: ${width}px !important;
      min-width: ${width}px !important;
      max-width: ${width}px !important;
      transform: none !important;
      translate: none !important;
      margin: 0 !important;
      will-change: auto !important;
      contain: layout style paint !important;
      isolation: isolate !important;
      touch-action: pan-y !important;
      z-index: ${zIndex} !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    `;

    // Observer les changements de style pour maintenir la position
    observerRef.current = new MutationObserver(() => {
      if (positionRef.current && menu) {
        const currentRect = menu.getBoundingClientRect();
        const { top: targetTop, left: targetLeft } = positionRef.current;
        
        if (
          Math.abs(currentRect.top - targetTop) > 0.5 ||
          Math.abs(currentRect.left - targetLeft) > 0.5
        ) {
          menu.style.cssText = `
            position: fixed !important;
            top: ${targetTop}px !important;
            left: ${targetLeft}px !important;
            width: ${positionRef.current.width}px !important;
            min-width: ${positionRef.current.width}px !important;
            max-width: ${positionRef.current.width}px !important;
            transform: none !important;
            translate: none !important;
            margin: 0 !important;
            will-change: auto !important;
            contain: layout style paint !important;
            isolation: isolate !important;
            touch-action: pan-y !important;
            z-index: ${zIndex} !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          `;
        }
      }
    });

    observerRef.current.observe(menu, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: false,
      subtree: false,
    });

    // Surveiller avec requestAnimationFrame pour une protection continue
    const checkPosition = () => {
      if (positionRef.current && menu) {
        const currentRect = menu.getBoundingClientRect();
        const { top: targetTop, left: targetLeft, width: targetWidth } = positionRef.current;
        
        if (
          Math.abs(currentRect.top - targetTop) > 0.5 ||
          Math.abs(currentRect.left - targetLeft) > 0.5 ||
          Math.abs(currentRect.width - targetWidth) > 1
        ) {
          menu.style.cssText = `
            position: fixed !important;
            top: ${targetTop}px !important;
            left: ${targetLeft}px !important;
            width: ${targetWidth}px !important;
            min-width: ${targetWidth}px !important;
            max-width: ${targetWidth}px !important;
            transform: none !important;
            translate: none !important;
            margin: 0 !important;
            will-change: auto !important;
            contain: layout style paint !important;
            isolation: isolate !important;
            touch-action: pan-y !important;
            z-index: ${zIndex} !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          `;
        }
        rafIdRef.current = requestAnimationFrame(checkPosition);
      }
    };
    rafIdRef.current = requestAnimationFrame(checkPosition);
  }, [isMobile, menuRef, triggerRef, calculateOptimalPosition, zIndex]);

  const unlockPosition = useCallback(() => {
    setIsLocked(false);
    positionRef.current = null;

    if (menuRef.current) {
      menuRef.current.style.cssText = '';
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, [menuRef]);

  // Verrouiller la position quand le menu s'ouvre sur mobile
  useEffect(() => {
    if (!isOpen || !isMobile) {
      unlockPosition();
      return;
    }

    // Attendre que Radix UI ait fini de positionner le menu
    timeoutRef.current = setTimeout(() => {
      lockPosition();
    }, lockDelay);

    // Essayer plusieurs fois pour s'assurer que le menu est bien positionné
    const timeout2 = setTimeout(() => {
      lockPosition();
    }, lockDelay * 2);

    const timeout3 = setTimeout(() => {
      lockPosition();
    }, lockDelay * 3);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      unlockPosition();
    };
  }, [isOpen, isMobile, lockPosition, unlockPosition, lockDelay]);

  // Nettoyer à la fermeture
  useEffect(() => {
    if (!isOpen) {
      unlockPosition();
    }
  }, [isOpen, unlockPosition]);

  // Ne pas verrouiller le scroll du body pour éviter de bloquer les interactions
  // Le positionnement fixe du menu suffit pour le garder visible
  // Si nécessaire, on peut ajouter un scroll lock optionnel plus tard

  const lockStyles: React.CSSProperties | undefined = isLocked && positionRef.current
    ? {
        position: 'fixed',
        top: `${positionRef.current.top}px`,
        left: `${positionRef.current.left}px`,
        width: `${positionRef.current.width}px`,
        minWidth: `${positionRef.current.width}px`,
        maxWidth: `${positionRef.current.width}px`,
        zIndex: zIndex,
        touchAction: 'pan-y', // Permet le scroll vertical mais bloque le scroll horizontal
        contain: 'layout style paint',
        isolation: 'isolate',
        overflowY: 'auto',
        overflowX: 'hidden',
      }
    : undefined;

  return {
    lockStyles,
    lockPosition,
    unlockPosition,
    isLocked,
  };
}

