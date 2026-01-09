import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 min-h-[44px] text-sm outline-none data-[state=open]:bg-accent focus:bg-accent touch-manipulation',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] max-w-[calc(100vw-2rem)] max-h-[min(24rem,calc(100dvh-6rem))] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

/**
 * Contenu du DropdownMenu - Menu déroulant
 *
 * Optimisé automatiquement pour mobile avec :
 * - Positionnement adaptatif (bottom sur mobile)
 * - Animations simplifiées
 * - Collision padding adaptatif
 *
 * @example
 * ```tsx
 * <DropdownMenuContent>
 *   <DropdownMenuItem>Option 1</DropdownMenuItem>
 *   <DropdownMenuItem>Option 2</DropdownMenuItem>
 * </DropdownMenuContent>
 * ```
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    /**
     * Activer l'optimisation mobile (positionnement et animations)
     * @default true
     */
    mobileOptimized?: boolean;
    /**
     * Variante d'affichage spécifique au mobile.
     * - "default": menu classique ancré au trigger
     * - "sheet": bottom sheet en bas de l'écran
     * @default "default"
     */
    mobileVariant?: 'default' | 'sheet';
  }
>(
  (
    { className, sideOffset = 4, mobileOptimized = true, mobileVariant = 'default', ...props },
    ref
  ) => {
    const isMobile = useIsMobile();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const isMobileSheet = isMobile && mobileOptimized && mobileVariant === 'sheet';

    // Bloquer le scroll du body uniquement sur mobile quand le menu est ouvert
    useBodyScrollLock(isMobile && mobileOptimized && isOpen);

    // Combiner les refs
    React.useImperativeHandle(
      ref,
      () => contentRef.current as React.ElementRef<typeof DropdownMenuPrimitive.Content>
    );

    // Détecter l'état d'ouverture via les attributs data
    React.useEffect(() => {
      if (!contentRef.current) return;

      const observer = new MutationObserver(() => {
        if (contentRef.current) {
          const state = contentRef.current.getAttribute('data-state');
          setIsOpen(state === 'open');
        }
      });

      observer.observe(contentRef.current, {
        attributes: true,
        attributeFilter: ['data-state'],
      });

      // Vérifier l'état initial
      if (contentRef.current) {
        const state = contentRef.current.getAttribute('data-state');
        setIsOpen(state === 'open');
      }

      return () => observer.disconnect();
    }, []);

    // Verrouiller le scroll du body sur mobile quand le menu est ouvert (comme SelectContent)
    useBodyScrollLock(isMobile && mobileOptimized && isOpen);

    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          ref={contentRef}
          sideOffset={sideOffset}
          side={isMobileSheet ? 'bottom' : isMobile && mobileOptimized ? 'bottom' : props.side}
          align={isMobileSheet ? 'center' : isMobile && mobileOptimized ? 'end' : props.align}
          // En mode sheet mobile, on gère nous-mêmes le positionnement : pas de collisions Radix
          // Exactement comme SelectContent : avoidCollisions={isMobileSheet ? false : true}
          avoidCollisions={isMobileSheet ? false : true}
          // Utiliser 'always' sur mobile pour empêcher tout mouvement (comme SelectContent)
          sticky={isMobile ? 'always' : (props.sticky ?? 'partial')}
          collisionPadding={
            isMobileSheet
              ? MOBILE_COLLISION_PADDING
              : isMobile && mobileOptimized
                ? MOBILE_COLLISION_PADDING
                : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)
          }
          style={{
            ...props.style,
            // Exactement comme SelectContent : seulement pour mobileSheet
            ...(isMobileSheet && {
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              top: 'auto',
              transform: 'none',
              width: '100vw',
              maxWidth: '100vw',
            }),
          }}
          className={cn(
            // Conteneur principal
            isMobileSheet
              ? 'fixed inset-x-0 bottom-0 z-[1060] w-screen max-h-[80vh] overflow-hidden rounded-t-2xl border bg-popover p-1 text-popover-foreground shadow-lg sm:relative sm:inset-auto sm:w-auto sm:max-h-[min(24rem,80vh)] sm:rounded-md'
              : 'z-[100] min-w-[8rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            // Verrouillage de position sur mobile (comme SelectContent)
            // Utiliser will-change et transform pour stabiliser lors de l'interaction
            isMobile && mobileOptimized && !isMobileSheet && 'will-change-auto',
            // Scroll interne mobile (menus longs)
            isMobileSheet &&
              'max-h-[min(24rem,calc(100dvh-6rem))] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            !isMobileSheet &&
              isMobile &&
              mobileOptimized &&
              'max-h-[min(24rem,calc(100dvh-6rem))] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            // Animations optimisées pour mobile - CSS only
            isMobileSheet
              ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:duration-150 data-[state=closed]:duration-100'
              : isMobile && mobileOptimized
                ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:duration-100'
                : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Portal>
    );
  }
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * Item du DropdownMenu - Option individuelle dans le menu
 *
 * Chaque item a une hauteur minimale de 44px pour respecter les guidelines de touch targets.
 *
 * @example
 * ```tsx
 *   Option 1
 * </DropdownMenuItem>
 * ```
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    /**
     * Ajouter un padding à gauche (pour les items avec icônes)
     */
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 min-h-[44px] text-sm outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'focus:bg-accent focus:text-accent-foreground',
        'active:bg-accent active:text-accent-foreground',
        // Optimisations tactiles
        'touch-manipulation',
        // Transition légère pour le feedback
        'transition-colors duration-75',
        // Zone de clic plus large sur mobile
        isMobile && 'py-2.5',
        inset && 'pl-8',
        className
      )}
      role="menuitem"
      {...props}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 min-h-[44px] text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground touch-manipulation',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 min-h-[44px] text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground touch-manipulation',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
