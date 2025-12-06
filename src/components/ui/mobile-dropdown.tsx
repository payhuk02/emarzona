/**
 * Composant MobileDropdown - Menu dropdown optimisé pour mobile
 * Gère automatiquement le positionnement stable, le scroll lock, et les interactions tactiles
 */

import React, { useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuShortcut,
} from './dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileDropdownProps {
  /**
   * Élément trigger (bouton, etc.)
   */
  trigger: React.ReactNode;
  /**
   * Contenu du menu
   */
  children: React.ReactNode;
  /**
   * Alignement du menu
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Côté d'ouverture du menu
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Offset depuis le trigger
   */
  sideOffset?: number;
  /**
   * Classes CSS supplémentaires
   */
  className?: string;
  /**
   * Classes CSS pour le contenu
   */
  contentClassName?: string;
  /**
   * Largeur du menu
   */
  width?: string | number;
  /**
   * Désactiver l'optimisation mobile
   */
  disableMobileOptimization?: boolean;
  /**
   * Callback quand le menu s'ouvre
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * État contrôlé d'ouverture
   */
  open?: boolean;
  /**
   * Mode modal (empêche les interactions en dehors)
   */
  modal?: boolean;
}

/**
 * Composant MobileDropdown - Menu dropdown optimisé pour mobile
 */
export const MobileDropdown: React.FC<MobileDropdownProps> = ({
  trigger,
  children,
  align = 'end',
  side = 'bottom',
  sideOffset = 4,
  className,
  contentClassName,
  width,
  disableMobileOptimization = false,
  onOpenChange,
  open: controlledOpen,
  modal = false,
}) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // DÉSACTIVÉ: Ne plus utiliser le hook de verrouillage agressif
  // Utiliser uniquement les props de Radix UI pour le positionnement
  // const { lockStyles, isLocked } = useMobileMenu({...});
  const lockStyles = undefined;
  const isLocked = false;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
    >
      <DropdownMenuTrigger
        ref={triggerRef}
        asChild
        className={cn('touch-manipulation', className)}
      >
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={menuRef}
        align={align}
        side={side}
        sideOffset={sideOffset}
        mobileOptimized={!disableMobileOptimization}
        className={cn(
          width && typeof width === 'number' ? `w-[${width}px]` : width,
          contentClassName
        )}
        style={
          width
            ? { width: typeof width === 'number' ? `${width}px` : width }
            : undefined
        }
        // Laisser Radix UI gérer tous les événements normalement
        // Pas de manipulation supplémentaire qui pourrait bloquer l'application
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Ré-exporter les composants enfants pour faciliter l'utilisation
export {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuShortcut,
};

