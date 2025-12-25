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
   * Variante d'affichage sur mobile pour le contenu.
   * - "default": petit menu ancré au trigger
   * - "sheet": bottom sheet en bas de l'écran
   * @default "default"
   */
  mobileVariant?: 'default' | 'sheet';
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
 *
 * Wrapper autour de DropdownMenu qui gère automatiquement :
 * - Le positionnement stable sur mobile
 * - Les animations optimisées
 * - La gestion de l'état (contrôlé ou non-contrôlé)
 *
 * @example
 * ```tsx
 * <MobileDropdown
 *   trigger={<Button>Menu</Button>}
 *   align="end"
 *   side="bottom"
 * >
 *   <DropdownMenuItem>Option 1</DropdownMenuItem>
 *   <DropdownMenuItem>Option 2</DropdownMenuItem>
 * </MobileDropdown>
 * ```
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
  mobileVariant = 'default',
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

  // Le positionnement est géré par Radix UI via les props
  // Pas besoin de hook supplémentaire

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={modal}>
      <DropdownMenuTrigger ref={triggerRef} asChild className={cn('touch-manipulation', className)}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={menuRef}
        align={align}
        side={side}
        sideOffset={sideOffset}
        mobileOptimized={!disableMobileOptimization}
        mobileVariant={mobileVariant}
        className={cn(
          // En mode bottom sheet mobile, on laisse la largeur se gérer en plein écran
          !(isMobile && mobileVariant === 'sheet') &&
            width &&
            typeof width === 'number' &&
            `w-[${width}px]`,
          !(isMobile && mobileVariant === 'sheet') && typeof width === 'string' && width,
          contentClassName
        )}
        style={
          isMobile && mobileVariant === 'sheet'
            ? undefined
            : width
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
