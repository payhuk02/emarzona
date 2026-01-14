/**
 * Composant MobileDropdown - Menu dropdown optimisé pour mobile (utilise maintenant Select)
 * Gère automatiquement le positionnement stable, le scroll lock, et les interactions tactiles
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from './select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileDropdownProps {
  /**
   * Élément trigger (bouton, etc.)
   */
  trigger: React.ReactNode;
  /**
   * Contenu du menu (SelectItem uniquement)
   */
  children: React.ReactNode;
  /**
   * Alignement du menu
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Classes CSS supplémentaires pour le trigger
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
   * Callback quand une valeur est sélectionnée
   */
  onValueChange?: (value: string) => void;
  /**
   * Valeur sélectionnée
   */
  value?: string;
}

/**
 * Composant MobileDropdown - Menu dropdown utilisant Select (version simplifiée)
 *
 * Wrapper autour de Select pour maintenir la compatibilité.
 *
 * @example
 * ```tsx
 * <MobileDropdown trigger={<Button>Menu</Button>}>
 *   <SelectItem value="option1">Option 1</SelectItem>
 *   <SelectItem value="option2">Option 2</SelectItem>
 * </MobileDropdown>
 * ```
 */
export const MobileDropdown: React.FC<MobileDropdownProps> = ({
  trigger,
  children,
  align = 'end',
  className,
  contentClassName,
  width,
  onValueChange,
  value,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn('touch-manipulation', className)}>
        {trigger}
      </SelectTrigger>
      <SelectContent
        mobileVariant="sheet"
        className={cn(
          'min-w-[200px]',
          typeof width === 'number' && `w-[${width}px]`,
          typeof width === 'string' && width,
          contentClassName
        )}
      >
        {children}
      </SelectContent>
    </Select>
  );
};

// Les composants enfants sont maintenant directement importés depuis @/components/ui/select






