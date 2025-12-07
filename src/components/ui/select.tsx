import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from "@/constants/mobile";

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
const SelectValue = SelectPrimitive.Value;

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
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex min-h-[44px] h-11 w-full max-w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left",
        // Optimisations tactiles
        "touch-manipulation",
        // Empêcher le zoom sur focus (iOS)
        isMobile && "text-base",
        // Feedback visuel au toucher
        "active:bg-accent active:opacity-90 transition-colors",
        className,
      )}
      aria-label={props['aria-label'] || "Select an option"}
      aria-haspopup="listbox"
      aria-expanded={props['aria-expanded']}
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
    className={cn("flex cursor-default items-center justify-center py-1", className)}
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
    className={cn("flex cursor-default items-center justify-center py-1", className)}
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
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const isMobile = useIsMobile();
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Combiner les refs
  React.useImperativeHandle(ref, () => contentRef.current as any);
  
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
  
  // Verrouiller la position sur mobile quand le menu est ouvert pour garantir la stabilité
  React.useEffect(() => {
    if (!isMobile || !isOpen || !contentRef.current) return;
    
    const menuElement = contentRef.current;
    let lockedPosition: { top: number; left: number; width: number } | null = null;
    let rafId: number | null = null;
    
    // Fonction pour verrouiller la position
    const lockPosition = () => {
      if (!menuElement) return;
      
      const rect = menuElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Le menu n'est pas encore positionné, réessayer
        rafId = requestAnimationFrame(lockPosition);
        return;
      }
      
      lockedPosition = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
      };
      
      // Forcer la position fixe pour éviter les mouvements
      const originalPosition = menuElement.style.position;
      const originalTop = menuElement.style.top;
      const originalLeft = menuElement.style.left;
      const originalWidth = menuElement.style.width;
      
      menuElement.style.position = 'fixed';
      menuElement.style.top = `${lockedPosition.top}px`;
      menuElement.style.left = `${lockedPosition.left}px`;
      menuElement.style.width = `${lockedPosition.width}px`;
      menuElement.style.maxWidth = `${lockedPosition.width}px`;
      
      // Surveiller les changements de position avec requestAnimationFrame
      const checkPosition = () => {
        if (!menuElement || !lockedPosition) return;
        
        const currentRect = menuElement.getBoundingClientRect();
        
        // Si la position a changé significativement (plus de 2px), la restaurer
        if (
          Math.abs(currentRect.top - lockedPosition.top) > 2 ||
          Math.abs(currentRect.left - lockedPosition.left) > 2
        ) {
          menuElement.style.top = `${lockedPosition.top}px`;
          menuElement.style.left = `${lockedPosition.left}px`;
        }
        
        if (isOpen) {
          rafId = requestAnimationFrame(checkPosition);
        }
      };
      
      rafId = requestAnimationFrame(checkPosition);
    };
    
    // Attendre que le menu soit positionné par Radix UI
    const lockTimeout = setTimeout(() => {
      lockPosition();
    }, 200);
    
    return () => {
      clearTimeout(lockTimeout);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (menuElement && lockedPosition) {
        // Restaurer les styles à la fermeture
        menuElement.style.position = '';
        menuElement.style.top = '';
        menuElement.style.left = '';
        menuElement.style.width = '';
        menuElement.style.maxWidth = '';
      }
    };
  }, [isMobile, isOpen]);
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={contentRef}
        className={cn(
          "relative z-[1060] max-h-[min(24rem,80vh)] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg",
          // Animations optimisées pour mobile - CSS only, pas de JS
          isMobile
            ? "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:duration-100"
            : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          // Optimisations mobile supplémentaires
          isMobile && "max-w-[calc(100vw-1rem)]",
          className,
        )}
        position={position}
        collisionPadding={isMobile ? MOBILE_COLLISION_PADDING : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)}
        // Éviter les collisions avec le clavier
        avoidCollisions={true}
        sticky={isMobile ? "always" : "partial"}
        style={{
          ...props.style,
          // Ajuster le positionnement si le clavier est ouvert
          ...(isMobile && isKeyboardOpen && keyboardHeight > 0 && {
            marginBottom: `${keyboardHeight}px`,
            maxHeight: `calc(80vh - ${keyboardHeight}px)`,
          }),
        }}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1 overflow-y-auto",
            // Scroll optimisé pour mobile - performance
            isMobile && "overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch",
            // Empêcher le scroll du body parent
            isMobile && "will-change-scroll",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
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
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-2.5 pl-8 pr-2 min-h-[44px] text-xs sm:text-sm outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Focus et active states optimisés
        "focus:bg-accent focus:text-accent-foreground",
        "active:bg-accent active:text-accent-foreground",
        // Optimisations tactiles
        "touch-manipulation",
        // Transition légère pour le feedback
        "transition-colors duration-75",
        // Zone de clic plus large sur mobile
        isMobile && "py-3",
        className,
      )}
      role="option"
      // Empêcher les événements de propagation qui pourraient fermer le menu
      // Utiliser onPointerDown pour capturer l'événement avant qu'il ne se propage
      onPointerDown={(e) => {
        // Empêcher la propagation qui pourrait fermer le menu prématurément
        // Mais ne pas empêcher le comportement par défaut pour permettre la sélection
        e.stopPropagation();
      }}
      // Gérer aussi les événements tactiles sur mobile
      onTouchStart={(e) => {
        // Sur mobile, empêcher la propagation des événements tactiles
        // qui pourraient causer des problèmes de stabilité
        e.stopPropagation();
      }}
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
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
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
