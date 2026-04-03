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

    let  finalTop= rect.top;
    let  finalLeft= rect.left;
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
    // DÉSACTIVÉ: Le verrouillage agressif bloque l'application
    // Utiliser uniquement les props de Radix UI pour le positionnement
    // Le positionnement sera géré par Radix UI avec avoidCollisions={false} et sticky="always"
    return;
  }, []);

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

  // DÉSACTIVÉ: Ne plus verrouiller la position agressivement
  // Laisser Radix UI gérer le positionnement avec les props appropriées
  useEffect(() => {
    // Toujours déverrouiller pour éviter tout blocage
    unlockPosition();
  }, [isOpen, isMobile, unlockPosition]);

  // Nettoyer à la fermeture
  useEffect(() => {
    if (!isOpen) {
      unlockPosition();
    }
  }, [isOpen, unlockPosition]);

  // Ne pas verrouiller le scroll du body pour éviter de bloquer les interactions
  // Le positionnement fixe du menu suffit pour le garder visible
  // Si nécessaire, on peut ajouter un scroll lock optionnel plus tard

  // Ne plus retourner de styles de verrouillage pour éviter de bloquer l'application
  const  lockStyles: React.CSSProperties | undefined = undefined;

  return {
    lockStyles,
    lockPosition,
    unlockPosition,
    isLocked,
  };
}







