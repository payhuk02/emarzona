/**
 * Hook useModal - Gestion simplifiée des modales
 * Fournit une API simple pour gérer l'ouverture/fermeture des modales
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useModal();
 * 
 * <Button onClick={open}>Ouvrir</Button>
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export interface UseModalOptions {
  /**
   * État initial d'ouverture
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Callback appelé quand la modale s'ouvre
   */
  onOpen?: () => void;
  /**
   * Callback appelé quand la modale se ferme
   */
  onClose?: () => void;
  /**
   * Empêcher la fermeture en cliquant sur l'overlay
   * @default false
   */
  preventCloseOnOverlay?: boolean;
  /**
   * Empêcher la fermeture avec la touche Escape
   * @default false
   */
  preventCloseOnEscape?: boolean;
}

export interface UseModalReturn {
  /**
   * Indique si la modale est ouverte
   */
  isOpen: boolean;
  /**
   * Ouvrir la modale
   */
  open: () => void;
  /**
   * Fermer la modale
   */
  close: () => void;
  /**
   * Toggle l'état d'ouverture
   */
  toggle: () => void;
  /**
   * Setter pour l'état d'ouverture
   */
  setIsOpen: (open: boolean) => void;
}

/**
 * Hook pour gérer une modale simple
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    defaultOpen = false,
    onOpen,
    onClose,
    preventCloseOnOverlay = false,
    preventCloseOnEscape = false,
  } = options;

  const [isOpen, setIsOpenState] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpenState(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpenState(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (open) {
        open();
      } else {
        close();
      }
    },
    [open, close]
  );

  // Gérer la touche Escape
  useEffect(() => {
    if (!isOpen || preventCloseOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, preventCloseOnEscape, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

/**
 * Hook pour gérer plusieurs modales
 */
export function useModals<T extends string>(
  modalNames: T[],
  options?: Omit<UseModalOptions, 'defaultOpen'>
): Record<T, UseModalReturn> & {
  /**
   * Ouvrir une modale spécifique
   */
  openModal: (name: T) => void;
  /**
   * Fermer une modale spécifique
   */
  closeModal: (name: T) => void;
  /**
   * Fermer toutes les modales
   */
  closeAll: () => void;
  /**
   * Indique si au moins une modale est ouverte
   */
  isAnyOpen: boolean;
} {
  const modals = modalNames.reduce(
    (acc, name) => {
      acc[name] = useModal(options);
      return acc;
    },
    {} as Record<T, UseModalReturn>
  );

  const openModal = useCallback(
    (name: T) => {
      modals[name].open();
    },
    [modals]
  );

  const closeModal = useCallback(
    (name: T) => {
      modals[name].close();
    },
    [modals]
  );

  const closeAll = useCallback(() => {
    modalNames.forEach((name) => {
      modals[name].close();
    });
  }, [modalNames, modals]);

  const isAnyOpen = modalNames.some((name) => modals[name].isOpen);

  return {
    ...modals,
    openModal,
    closeModal,
    closeAll,
    isAnyOpen,
  };
}

/**
 * Hook pour gérer une modale responsive (BottomSheet sur mobile, Dialog sur desktop)
 */
export function useResponsiveModal(options: UseModalOptions = {}) {
  const isMobile = useIsMobile();
  const modal = useModal(options);

  return {
    ...modal,
    /**
     * Indique si on doit utiliser BottomSheet
     */
    useBottomSheet: isMobile,
    /**
     * Indique si on doit utiliser Dialog
     */
    useDialog: !isMobile,
  };
}







