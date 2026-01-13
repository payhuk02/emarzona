import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

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
     * - "sheet": bottom sheet en bas de l'écran (STABLE - comme SelectContent)
     * @default "sheet" (comme SelectContent pour stabilité)
     */
    mobileVariant?: 'default' | 'sheet';
  }
>(
  (
    { className, sideOffset = 4, mobileOptimized = true, mobileVariant = 'sheet', ...props },
    ref
  ) => {
    const isMobile = useIsMobile();
    const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard();
    const contentRef = React.useRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const isMobileSheet = isMobile && mobileOptimized && mobileVariant === 'sheet';

    // Exposer la ref interne à l'extérieur si nécessaire (EXACTEMENT comme SelectContent)
    React.useImperativeHandle(
      ref,
      () => contentRef.current as React.ElementRef<typeof DropdownMenuPrimitive.Content>
    );

    // Suivre l'état d'ouverture via l'attribut data-state (EXACTEMENT comme SelectContent)
    React.useEffect(() => {
      if (!contentRef.current) return;

      const node = contentRef.current;

      const updateState = () => {
        const state = node.getAttribute('data-state');
        setIsOpen(state === 'open');
      };

      const observer = new MutationObserver(updateState);
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['data-state'],
      });

      // État initial
      updateState();

      return () => observer.disconnect();
    }, []);

    // Verrouiller le scroll du body sur mobile quand le menu est ouvert (EXACTEMENT comme SelectContent)
    useBodyScrollLock(isMobile && mobileOptimized && isOpen);

    return (
      <DropdownMenuPrimitive.Portal>
        {/* Wrapper pour forcer le positionnement absolu en mode sheet mobile */}
        {isMobileSheet ? (
          <div
            className="fixed inset-x-0 bottom-0 z-[1060] max-h-[80vh] w-full overflow-hidden rounded-t-2xl border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:duration-150 data-[state=closed]:duration-100"
            style={{
              marginBottom:
                isMobile && isKeyboardOpen && keyboardHeight > 0
                  ? `${keyboardHeight}px`
                  : undefined,
              maxHeight:
                isMobile && isKeyboardOpen && keyboardHeight > 0
                  ? `calc(80vh - ${keyboardHeight}px)`
                  : undefined,
            }}
          >
            <DropdownMenuPrimitive.Content
              ref={contentRef}
              sideOffset={0}
              className={cn(
                'relative z-[1060] max-h-[80vh] w-full overflow-hidden rounded-t-2xl border-0 bg-transparent text-popover-foreground shadow-none',
                className
              )}
              collisionPadding={0}
              avoidCollisions={false}
              sticky="always"
              {...props}
            >
              {/* Viewport pour les enfants (EXACTEMENT comme SelectContent) */}
              <div className="p-1 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] will-change-scroll scroll-smooth">
                {props.children}
              </div>
            </DropdownMenuPrimitive.Content>
          </div>
        ) : (
          <DropdownMenuPrimitive.Content
            ref={contentRef}
            sideOffset={sideOffset}
            side={props.side}
            align={props.align}
            className={cn(
              'relative z-[1060] max-h-[min(24rem,80vh)] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg',
              // Animations pour desktop
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              // Optimisations mobile supplémentaires
              isMobile && 'max-w-[calc(100vw-1rem)]',
              className
            )}
            collisionPadding={
              isMobile
                ? MOBILE_COLLISION_PADDING
                : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)
            }
            avoidCollisions={true}
            sticky={isMobile ? 'always' : 'partial'}
            {...props}
          />
        )}
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
        // Optimisations tactiles (EXACTEMENT comme SelectItem)
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

/**
 * StableDropdownMenu - Menu stable utilisant DropdownMenuContent mobileVariant="sheet"
 *
 * Utilise DropdownMenuContent avec mobileVariant="sheet" pour stabilité parfaite sur mobile,
 * exactement comme les menus des wizards produits (catégorie, modèle de tarification, etc.)
 */
const StableDropdownMenu = React.forwardRef<
  HTMLButtonElement,
  {
    /**
     * Contenu du menu avec les items
     */
    children: React.ReactNode;
    /**
     * Classe CSS pour le trigger
     */
    triggerClassName?: string;
    /**
     * Contenu du trigger
     */
    triggerContent?: React.ReactNode;
    /**
     * Props supplémentaires pour le trigger Button
     */
    triggerProps?: React.ComponentPropsWithoutRef<typeof Button>;
  }
>(({ children, triggerClassName, triggerContent, triggerProps }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  // Verrouiller le scroll du body sur mobile quand le menu est ouvert
  useBodyScrollLock(isMobile && isOpen);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button ref={ref} className={triggerClassName} {...triggerProps}>
          {triggerContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        mobileVariant="sheet"
        className="min-w-[200px]"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
StableDropdownMenu.displayName = 'StableDropdownMenu';

/**
 * StableDropdownMenuItem - Item utilisant DropdownMenuItem avec gestion tactile optimisée
 */
const StableDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  {
    onClick?: () => void;
    /**
     * Contenu de l'item
     */
    children: React.ReactNode;
    /**
     * Autres props pour l'item
     */
    className?: string;
    disabled?: boolean;
  }
>(({ onClick, children, className, disabled, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenuItem
      ref={ref}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-2.5 pl-8 pr-2 min-h-[44px] text-xs sm:text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'touch-manipulation',
        'transition-colors duration-75',
        // Optimisations spécifiques pour mobile tactile - zones de clic plus grandes
        isMobile && 'py-3 min-h-[48px] text-base',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </DropdownMenuItem>
  );
});
StableDropdownMenuItem.displayName = 'StableDropdownMenuItem';

/**
 * StableDropdownMenuSeparator - Séparateur utilisant DropdownMenuSeparator
 */
const StableDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSeparator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSeparator>
>((props, ref) => <DropdownMenuSeparator ref={ref} {...props} />);
StableDropdownMenuSeparator.displayName = 'StableDropdownMenuSeparator';

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
  // Nouvelles versions stables
  StableDropdownMenu,
  StableDropdownMenuItem,
  StableDropdownMenuSeparator,
  // Versions unifiées (cohérentes avec Select)
  UnifiedMenu,
  UnifiedMenuContent,
  UnifiedMenuItem,
  // Alias compatibilité
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuSeparator,
  SelectMenuLabel,
};

// Alias pour assurer la cohérence avec SelectContent
export const SelectMenuContent = DropdownMenuContent;
export const SelectMenuItem = DropdownMenuItem;
export const SelectMenuSeparator = DropdownMenuSeparator;
export const SelectMenuLabel = DropdownMenuLabel;

/**
 * UnifiedMenuContent - Menu unifié qui respecte exactement les mêmes styles que SelectContent
 *
 * Utilise automatiquement :
 * - mobileVariant="sheet" pour stabilité sur mobile
 * - mobileOptimized=true pour optimisations tactiles
 * - Même animations et styles que SelectContent
 */
export const UnifiedMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContent>
>((props, ref) => (
  <DropdownMenuContent
    ref={ref}
    mobileOptimized={true}
    mobileVariant="sheet"
    side="bottom"
    align="start"
    {...props}
  />
));
UnifiedMenuContent.displayName = 'UnifiedMenuContent';

/**
 * UnifiedMenuItem - Item unifié qui respecte exactement les mêmes styles que SelectItem
 */
export const UnifiedMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem>
>((props, ref) => <DropdownMenuItem ref={ref} {...props} />);
UnifiedMenuItem.displayName = 'UnifiedMenuItem';

/**
 * UnifiedMenu - Wrapper complet pour garantir cohérence avec Select
 */
export const UnifiedMenu = DropdownMenu;
