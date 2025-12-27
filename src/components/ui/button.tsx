import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:shadow-medium touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] h-11 px-4 py-2 text-sm",
        sm: "min-h-[44px] h-11 rounded-md px-3 text-xs sm:text-sm",
        lg: "min-h-[44px] h-11 sm:h-12 rounded-md px-6 sm:px-8 text-sm sm:text-base",
        icon: "min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { triggerHaptic } = useHapticFeedback();
    
    // Ajouter aria-label automatiquement si non fourni et children est une string
    // Cela améliore l'accessibilité pour les lecteurs d'écran
    const ariaLabel = props['aria-label'] || (typeof children === 'string' ? children : undefined);
    
    // Wrapper onClick avec feedback haptique sur mobile
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Feedback haptique léger sur mobile
      if (onClick) {
        triggerHaptic('light');
        onClick(e);
      }
    }, [onClick, triggerHaptic]);
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props}
        onClick={handleClick}
        aria-label={ariaLabel}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };






