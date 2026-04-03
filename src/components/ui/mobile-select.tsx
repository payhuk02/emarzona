import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';

/**
 * Handle impératif pour contrôler un MobileSelect
 */
export interface MobileSelectHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

type BaseSelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

export interface MobileSelectProps extends Omit<
  BaseSelectProps,
  'open' | 'onOpenChange' | 'onValueChange'
> {
  /**
   * État contrôlé d'ouverture
   */
  open?: boolean;
  /**
   * État initial d'ouverture (non contrôlé)
   */
  defaultOpen?: boolean;
  /**
   * Callback quand l'état d'ouverture change
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Callback standard Radix quand la valeur change
   */
  onValueChange?: (value: string) => void;
  /**
   * Callback pratique déclenché après sélection d'une option
   */
  onSelect?: (value: string) => void;
  /**
   * Trigger, contenu, items (utiliser SelectTrigger, SelectContent, SelectItem, etc.)
   */
  children: React.ReactNode;
}

/**
 * MobileSelect
 *
 * Wrapper autour de Radix Select.Root avec :
 * - API impérative : open(), close(), toggle()
 * - Support contrôlé / non contrôlé
 * - Callback unifié onSelect() en plus de onValueChange()
 *
 * Il réutilise les mêmes sous-composants que le Select standard :
 * - SelectTrigger, SelectContent, SelectItem, etc. (voir `components/ui/select.tsx`)
 */
export const MobileSelect = React.forwardRef<MobileSelectHandle, MobileSelectProps>(
  (
    {
      open: controlledOpen,
      defaultOpen,
      onOpenChange,
      onValueChange,
      onSelect,
      children,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen ?? false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = React.useCallback(
      (nextOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      },
      [isControlled, onOpenChange]
    );

    React.useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen(!open),
      }),
      [open, setOpen]
    );

    const handleValueChange = React.useCallback(
      (value: string) => {
        onValueChange?.(value);
        onSelect?.(value);
      },
      [onValueChange, onSelect]
    );

    return (
      <SelectPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    );
  }
);

MobileSelect.displayName = 'MobileSelect';






