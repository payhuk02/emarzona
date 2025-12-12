import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';

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
      'z-50 min-w-[8rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
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
  }
>(({ className, sideOffset = 4, mobileOptimized = true, ...props }, ref) => {
  const isMobile = useIsMobile();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

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

  // Verrouiller la position sur mobile quand le menu est ouvert pour garantir la stabilité
  React.useEffect(() => {
    if (!isMobile || !mobileOptimized || !isOpen || !contentRef.current) return;

    const menuElement = contentRef.current;
    let lockedPosition: { top: number; left: number; width: number } | null = null;
    let rafId: number | null = null;

    // Fonction pour verrouiller la position
    const lockPosition = () => {
      if (!menuElement) return;

      const rect = menuElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Le menu n'est pas encore positionné, réessayer
        // Limiter les tentatives pour éviter les boucles infinies
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(lockPosition);
        return;
      }

      lockedPosition = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
      };

      // Forcer la position fixe pour éviter les mouvements
      menuElement.style.position = 'fixed';
      menuElement.style.top = `${lockedPosition.top}px`;
      menuElement.style.left = `${lockedPosition.left}px`;
      menuElement.style.width = `${lockedPosition.width}px`;
      menuElement.style.maxWidth = `${lockedPosition.width}px`;

      // Surveiller les changements de position avec requestAnimationFrame
      const checkPosition = () => {
        // Vérifier que le menu est toujours ouvert et que l'élément existe
        if (!menuElement || !lockedPosition || !isOpen) {
          rafId = null;
          return;
        }

        const currentRect = menuElement.getBoundingClientRect();

        // Si la position a changé significativement (plus de 2px), la restaurer
        if (
          Math.abs(currentRect.top - lockedPosition.top) > 2 ||
          Math.abs(currentRect.left - lockedPosition.left) > 2
        ) {
          menuElement.style.top = `${lockedPosition.top}px`;
          menuElement.style.left = `${lockedPosition.left}px`;
        }

        // Continuer la surveillance seulement si le menu est toujours ouvert
        if (isOpen && menuElement.isConnected) {
          rafId = requestAnimationFrame(checkPosition);
        } else {
          rafId = null;
        }
      };

      // Démarrer la surveillance
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
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
  }, [isMobile, mobileOptimized, isOpen]);

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={contentRef}
        sideOffset={sideOffset}
        side={isMobile && mobileOptimized ? 'bottom' : props.side}
        align={isMobile && mobileOptimized ? 'end' : props.align}
        // IMPORTANT: Laisser avoidCollisions activé pour que Radix UI gère le positionnement
        avoidCollisions={props.avoidCollisions ?? true}
        collisionPadding={
          isMobile && mobileOptimized
            ? MOBILE_COLLISION_PADDING
            : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)
        }
        sticky={isMobile && mobileOptimized ? 'always' : (props.sticky ?? 'partial')}
        // Empêcher la fermeture du menu lors d'interactions à l'intérieur
        onInteractOutside={e => {
          // Sur mobile, empêcher la fermeture si l'interaction est dans le menu
          if (isMobile && mobileOptimized && contentRef.current) {
            const target = e.target as HTMLElement;
            if (contentRef.current.contains(target)) {
              e.preventDefault();
            }
          }
          props.onInteractOutside?.(e);
        }}
        onPointerDownOutside={e => {
          // Sur mobile, empêcher la fermeture si le clic est dans le menu
          if (isMobile && mobileOptimized && contentRef.current) {
            const target = e.target as HTMLElement;
            if (contentRef.current.contains(target)) {
              e.preventDefault();
            }
          }
          props.onPointerDownOutside?.(e);
        }}
        className={cn(
          'z-[100] min-w-[8rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          // Animations optimisées pour mobile - CSS only
          isMobile && mobileOptimized
            ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:duration-100'
            : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * Item du DropdownMenu - Option individuelle dans le menu
 *
 * Chaque item a une hauteur minimale de 44px pour respecter les guidelines de touch targets.
 *
 * @example
 * ```tsx
 * <DropdownMenuItem onSelect={() => console.log('Selected')}>
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
>(({ className, inset, onSelect, ...props }, ref) => {
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
      onSelect={event => {
        // Laisser Radix UI gérer la sélection normalement
        // Le menu se fermera automatiquement après la sélection
        onSelect?.(event);
      }}
      // Gestion optimisée pour mobile tactile
      {...(isMobile
        ? {
            // Sur mobile, utiliser onClick pour garantir la détection
            onClick: (e: React.MouseEvent) => {
              // Laisser Radix UI gérer via onSelect
              props.onClick?.(e);
            },
            onTouchStart: (e: React.TouchEvent) => {
              // Feedback visuel immédiat
              if (e.currentTarget) {
                e.currentTarget.classList.add('active');
              }
              // Ne pas bloquer la propagation pour permettre la sélection
              props.onTouchStart?.(e);
            },
            onTouchEnd: (e: React.TouchEvent) => {
              // Retirer le feedback après un délai
              setTimeout(() => {
                if (e.currentTarget) {
                  e.currentTarget.classList.remove('active');
                }
              }, 200);
              props.onTouchEnd?.(e);
            },
          }
        : {
            // Sur desktop, empêcher la propagation pour éviter la fermeture prématurée
            onPointerDown: (e: React.PointerEvent) => {
              e.stopPropagation();
              props.onPointerDown?.(e);
            },
          })}
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
