/**
 * Select Virtualisé - Composant Select optimisé pour longues listes
 *
 * Utilise la virtualisation pour améliorer les performances avec des listes de plus de 20 items.
 * Automatiquement activé si la liste contient plus de 20 items.
 *
 * @example
 * ```tsx
 * <SelectVirtualized
 *   value={value}
 *   onValueChange={setValue}
 *   options={longList} // > 20 items
 * >
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choisir..." />
 *   </SelectTrigger>
 * </SelectVirtualized>
 * ```
 */

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  MOBILE_COLLISION_PADDING,
  DESKTOP_COLLISION_PADDING,
  MIN_TOUCH_TARGET,
} from '@/constants/mobile';
import { SelectScrollUpButton, SelectScrollDownButton } from './select';

const VIRTUALIZATION_THRESHOLD = 20; // Activer la virtualisation si > 20 items

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectVirtualizedProps {
  /**
   * Valeur sélectionnée
   */
  value?: string;
  /**
   * Callback quand la valeur change
   */
  onValueChange?: (value: string) => void;
  /**
   * Options à afficher
   */
  options: SelectOption[];
  /**
   * Placeholder
   */
  placeholder?: string;
  /**
   * Désactiver le select
   */
  disabled?: boolean;
  /**
   * Hauteur estimée de chaque item (en pixels)
   * @default 44 (MIN_TOUCH_TARGET)
   */
  itemHeight?: number;
  /**
   * Hauteur maximale du contenu
   * @default "min(24rem, 80vh)"
   */
  maxHeight?: string;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Classe CSS pour le trigger
   */
  triggerClassName?: string;
  /**
   * Forcer la virtualisation même si < 20 items
   */
  forceVirtualization?: boolean;
  /**
   * Enfants (généralement SelectTrigger avec SelectValue)
   */
  children: React.ReactNode;
}

/**
 * Composant Select virtualisé pour longues listes
 */
export const SelectVirtualized : React.FC<SelectVirtualizedProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Sélectionner...',
  disabled = false,
  itemHeight = MIN_TOUCH_TARGET,
  maxHeight = 'min(24rem, 80vh)',
  className,
  triggerClassName,
  forceVirtualization = false,
  children,
}) => {
  const isMobile = useIsMobile();
  const shouldVirtualize = forceVirtualization || options.length > VIRTUALIZATION_THRESHOLD;
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: isMobile ? 3 : 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      {children}

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-[1060] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg',
            // Empêcher le menu de dépasser l'écran sur mobile
            'max-w-[calc(100vw-1rem)]',
            // Animations optimisées pour mobile
            isMobile
              ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
              : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          position="popper"
          collisionPadding={isMobile ? MOBILE_COLLISION_PADDING : DESKTOP_COLLISION_PADDING}
        >
          <SelectScrollUpButton />

          {shouldVirtualize ? (
            <div
              ref={parentRef}
              className="p-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
              style={{ maxHeight }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                  }}
                >
                  {virtualItems.map(virtualItem => {
                    const option = options[virtualItem.index];
                    return (
                      <SelectPrimitive.Item
                        key={virtualItem.key}
                        value={option.value}
                        disabled={option.disabled}
                        className={cn(
                          'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 min-h-[44px] text-xs sm:text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground touch-manipulation',
                          'active:bg-accent active:text-accent-foreground'
                        )}
                        style={{
                          height: `${virtualItem.size}px`,
                        }}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        role="option"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center flex-shrink-0">
                          <SelectPrimitive.ItemIndicator>
                            <Check className="h-3.5 w-3.5" />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText className="truncate">
                          {option.label}
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <SelectPrimitive.Viewport className="p-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              {options.map(option => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 min-h-[44px] text-xs sm:text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground touch-manipulation',
                    'active:bg-accent active:text-accent-foreground'
                  )}
                  role="option"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center flex-shrink-0">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3.5 w-3.5" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText className="truncate">
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          )}

          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};







