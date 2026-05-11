/**
 * Hook pour utiliser BottomSheet sur mobile et Dialog sur desktop
 * Automatise le choix du bon composant selon la taille d'écran
 */

import { useState } from 'react';
import { useIsMobile } from './use-mobile';

interface UseResponsiveModalOptions {
  /**
   * État initial d'ouverture
   */
  defaultOpen?: boolean;
  /**
   * Forcer l'utilisation de BottomSheet même sur desktop
   */
  forceBottomSheet?: boolean;
  /**
   * Forcer l'utilisation de Dialog même sur mobile
   */
  forceDialog?: boolean;
}

interface UseResponsiveModalReturn {
  /**
   * État d'ouverture
   */
  open: boolean;
  /**
   * Fonction pour ouvrir/fermer
   */
  setOpen: (open: boolean) => void;
  /**
   * Indique si on doit utiliser BottomSheet
   */
  useBottomSheet: boolean;
  /**
   * Indique si on doit utiliser Dialog
   */
  useDialog: boolean;
}

/**
 * Hook pour gérer les modales de manière responsive
 */
export function useResponsiveModal({
  defaultOpen = false,
  forceBottomSheet = false,
  forceDialog = false,
}: UseResponsiveModalOptions = {}): UseResponsiveModalReturn {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpen);

  // Déterminer quel composant utiliser
  const useBottomSheet = forceBottomSheet || (isMobile && !forceDialog);
  const useDialog = forceDialog || (!isMobile && !forceBottomSheet);

  return {
    open,
    setOpen,
    useBottomSheet,
    useDialog,
  };
}







