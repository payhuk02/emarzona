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
import { useMobileMenu } from '@/hooks/use-mobile-menu';
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

  // Utiliser le hook pour gérer le positionnement mobile
  const { lockStyles, isLocked } = useMobileMenu({
    menuRef: menuRef as React.RefObject<HTMLElement>,
    isOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    lockDelay: 150,
    collisionPadding: 8,
    zIndex: 100,
  });

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
          isMobile && !disableMobileOptimization && isLocked && '!fixed',
          width && typeof width === 'number' ? `w-[${width}px]` : width,
          contentClassName
        )}
        style={
          isMobile && !disableMobileOptimization && lockStyles
            ? { ...lockStyles, ...(width && { width: typeof width === 'number' ? `${width}px` : width }) }
            : width
            ? { width: typeof width === 'number' ? `${width}px` : width }
            : undefined
        }
        onCloseAutoFocus={(e) => {
          if (isMobile && !disableMobileOptimization) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture accidentelle quand le menu est verrouillé
          if (isLocked && isMobile && !disableMobileOptimization) {
            const target = e.target as HTMLElement;
            if (menuRef.current?.contains(target)) {
              e.preventDefault();
            }
          }
        }}
        onInteractOutside={(e) => {
          // Empêcher la fermeture accidentelle quand le menu est verrouillé
          if (isLocked && isMobile && !disableMobileOptimization) {
            const target = e.target as HTMLElement;
            if (menuRef.current?.contains(target)) {
              e.preventDefault();
            }
          }
        }}
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

