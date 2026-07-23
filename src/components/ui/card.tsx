import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default: "hover:shadow-md",
        premium: "rounded-[1.5rem] border-0 bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.6),inset_0_0_0_1px_rgba(255,255,255,0.2)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)] hover:-translate-y-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardVariants({ variant, className }))} 
      {...props} 
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "flex flex-col space-y-1.5",
        "p-4 sm:p-5 md:p-6", // Augmented padding for premium feel
        className
      )} 
      {...props} 
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg sm:text-xl md:text-2xl font-bold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-medium text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        "p-4 sm:p-5 md:p-6 pt-0", 
        "overflow-x-hidden", 
        className
      )} 
      {...props} 
    />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 sm:p-5 md:p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
