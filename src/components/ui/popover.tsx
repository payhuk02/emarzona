import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_COLLISION_PADDING, DESKTOP_COLLISION_PADDING } from '@/constants/mobile';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => {
  const isMobile = useIsMobile();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={
          isMobile
            ? MOBILE_COLLISION_PADDING
            : (props.collisionPadding ?? DESKTOP_COLLISION_PADDING)
        }
        avoidCollisions={props.avoidCollisions ?? true}
        sticky={isMobile ? 'always' : (props.sticky ?? 'partial')}
        className={cn(
          'z-[100] w-[calc(100vw-1rem)] sm:w-72 max-w-[calc(100vw-1rem)] sm:max-w-sm rounded-md border bg-popover p-3 sm:p-4 text-popover-foreground shadow-md outline-none',
          // Mobile/iOS: éviter popover trop haut (clavier/barres) + scroll interne fluide
          'max-h-[min(24rem,calc(100vh-2rem))] max-h-[min(24rem,calc(100dvh-2rem))] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
          // Animations optimisées pour mobile - CSS only
          isMobile
            ? 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=closed]:duration-100'
            : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
