import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';

/**
 * Composant Select optimisé pour mobile
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choisir..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">Option 1</SelectItem>
 *     <SelectItem value="2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
const Select = SelectPrimitive.Root;

/**
 * Groupe d'options dans un Select
 */
const SelectGroup = SelectPrimitive.Group;

/**
 * Valeur affichée dans le SelectTrigger
 */
const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ placeholder = 'Sélectionner...', ...props }, ref) => (
  <SelectPrimitive.Value ref={ref} placeholder={placeholder} {...props} />
));
SelectValue.displayName = SelectPrimitive.Value.displayName;

/**
 * Trigger du Select - Bouton qui ouvre le menu de sélection
 *
 * @example
 * ```tsx
 * <SelectTrigger>
 *   <SelectValue placeholder="Sélectionner..." />
 * </SelectTrigger>
 * ```
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /**
     * Message d'erreur à afficher
     */
    error?: string;
    /**
     * ID de l'élément d'erreur (pour aria-describedby)
     */
    errorId?: string;
  }
>(({ className, children, error, errorId, ...props }, ref) => {
  const isMobile = useIsMobile();
  const hasError = !!error;

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex min-h-[44px] h-11 w-full max-w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left',
        // État d'erreur
        hasError && 'border-destructive focus-visible:ring-destructive',
        // Optimisations tactiles
        'touch-manipulation',
        // Empêcher le zoom sur focus (iOS)
        isMobile && 'text-base',
        // Feedback visuel au toucher - mobile friendly (sans hacks JS)
        'active:bg-accent active:opacity-90 transition-colors duration-75',
        // Améliorer la zone de clic sur mobile
        isMobile && 'cursor-pointer',
        className
      )}
      aria-label={props['aria-label'] || 'Sélectionner une option'}
      aria-haspopup="listbox"
      aria-expanded={props['aria-expanded']}
      aria-invalid={hasError}
      aria-describedby={hasError && errorId ? errorId : props['aria-describedby']}
      // Empêcher le zoom automatique sur iOS
      {...(isMobile && { style: { fontSize: '16px', ...props.style } })}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/**
 * Contenu du Select - Menu déroulant avec les options
 *
 * Optimisé automatiquement pour mobile avec :
 * - Animations simplifiées
 * - Collision padding adaptatif
 * - Scroll optimisé pour tactile
 *
 * @example
 * ```tsx
 * <SelectContent>
 *   <SelectItem value="1">Option 1</SelectItem>
 *   <SelectItem value="2">Option 2</SelectItem>
 * </SelectContent>
 * ```
 */
type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  /**
   * Variante d'affichage spécifique au mobile.
   * - "sheet": bottom sheet en bas de l'écran sur mobile (par défaut)
   * - "default": comportement standard (dropdown classique)
   */
  mobileVariant?: 'default' | 'sheet';
};

const SelectContentComponent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', mobileVariant = 'sheet', ...props }, ref) => {
  const isMobile = useIsMobile();
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard();
  const contentRef = React.useRef<React.ElementRef<typeof SelectPrimitive.Content>>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const isMobileSheet = isMobile && mobileVariant === 'sheet';
  const resolvedPosition = isMobileSheet ? 'item-aligned' : position;

  // Exposer la ref interne à l'extérieur si nécessaire
  React.useImperativeHandle(
    ref,
    () => contentRef.current as React.ElementRef<typeof SelectPrimitive.Content>
  );

  // Suivre l'état d'ouverture via l'attribut data-state
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

  // Verrouiller le scroll du body sur mobile quand le Select est ouvert
  useBodyScrollLock(isMobile && isOpen);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={contentRef}
        className={cn(
          // Conteneur principal
          isMobileSheet
            ? 'fixed inset-x-0 bottom-0 z-[1060] max-h-[80vh] w-full overflow-hidden rounded-t-2xl border bg-popover text-popover-foreground shadow-lg sm:relative sm:inset-auto sm:w-auto sm:max-h-[min(24rem,80vh)] sm:rounded-md'
            : 'relative z-[1060] max-h-[min(24rem,80vh)] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg',
          // Animations optimisées pour mobile - CSS only, pas de JS
          isMobile
            ? isMobileSheet
              ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:duration-150 data-[state=closed]:duration-100'
              : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:duration-100'
            : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          !isMobileSheet &&
            position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          // Optimisations mobile supplémentaires
          isMobile && !isMobileSheet && 'max-w-[calc(100vw-1rem)]',
          className
        )}
        position={resolvedPosition}
        collisionPadding={
          isMobile
            ? MOBILE_COLLISION_PADDING
            : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)
        }
        // En mode sheet mobile, on gère nous-mêmes le positionnement : pas de collisions Radix
        avoidCollisions={isMobileSheet ? false : true}
        sticky={isMobile ? 'always' : 'partial'}
        style={{
          ...props.style,
          // Forcer un bottom sheet plein écran correctement centré sur mobile
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
          // Ajuster le positionnement si le clavier est ouvert
          ...(isMobile &&
            isKeyboardOpen &&
            keyboardHeight > 0 && {
              marginBottom: `${keyboardHeight}px`,
              maxHeight: `calc(80vh - ${keyboardHeight}px)`,
            }),
        }}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1 overflow-y-auto',
            // Scroll optimisé pour mobile - performance
            isMobile && 'overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]',
            // Empêcher le scroll du body parent
            isMobile && 'will-change-scroll',
            // Améliorer la réactivité du scroll sur mobile
            isMobile && 'scroll-smooth',
            position === 'popper' &&
              !isMobileSheet &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

// Optimisation avec React.memo pour éviter les re-renders inutiles
const SelectContent = React.memo(SelectContentComponent);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * Item du Select - Option individuelle dans le menu
 *
 * Chaque item a une hauteur minimale de 44px pour respecter les guidelines de touch targets.
 *
 * @example
 * ```tsx
 * <SelectItem value="option1">Option 1</SelectItem>
 * ```
 */
const SelectItemComponent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-2.5 pl-8 pr-2 min-h-[44px] text-xs sm:text-sm outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        // Focus et active states optimisés
        'focus:bg-accent focus:text-accent-foreground',
        'active:bg-accent active:text-accent-foreground',
        // Optimisations tactiles
        'touch-manipulation',
        // Transition légère pour le feedback
        'transition-colors duration-75',
        // Zone de clic plus large sur mobile
        isMobile && 'py-3',
        className
      )}
      role="option"
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center flex-shrink-0">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText className="truncate flex-1">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

// Optimisation avec React.memo pour éviter les re-renders inutiles
const SelectItem = React.memo(SelectItemComponent);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

// Ré-exporter SelectField / MobileSelect pour faciliter l'import
export { SelectField } from './select-field';
export type { SelectFieldProps } from './select-field';
export { MobileSelect } from './mobile-select';
export type { MobileSelectProps, MobileSelectHandle } from './mobile-select';






