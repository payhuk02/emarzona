import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:shadow-medium touch-manipulation select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[44px] h-auto px-4 py-2 text-sm',
        sm: 'min-h-[44px] h-auto rounded-md px-3 py-1.5 text-sm',
        lg: 'min-h-[48px] h-auto rounded-md px-6 sm:px-8 py-2.5 text-sm sm:text-base',
        icon: 'min-h-[44px] min-w-[44px] w-11 h-11 aspect-square',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function hasAccessibleName(
  props: Pick<ButtonProps, 'aria-label' | 'aria-labelledby' | 'title'>,
  children: React.ReactNode
): boolean {
  if (props['aria-label']?.trim()) return true;
  if (props['aria-labelledby']?.trim()) return true;
  if (typeof props.title === 'string' && props.title.trim()) return true;
  if (typeof children === 'string' && children.trim()) return true;
  if (typeof children === 'number') return true;
  return React.Children.toArray(children).some(child => {
    if (typeof child === 'string' && child.trim()) return true;
    if (typeof child === 'number') return true;
    if (!React.isValidElement(child)) return false;
    if (child.type === 'span' && child.props.className?.includes?.('sr-only')) return true;
    if (typeof child.props?.children === 'string' && child.props.children.trim()) return true;
    return false;
  });
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const { triggerHaptic } = useHapticFeedback();

    const ariaLabel = props['aria-label'] || (typeof children === 'string' ? children : undefined);

    if (
      process.env.NODE_ENV !== 'production' &&
      !asChild &&
      size === 'icon' &&
      !hasAccessibleName(props, children)
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Button] size="icon" requires aria-label, aria-labelledby, title, or sr-only text.'
      );
    }

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) {
          triggerHaptic('light');
          onClick(e);
        }
      },
      [onClick, triggerHaptic]
    );

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
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
