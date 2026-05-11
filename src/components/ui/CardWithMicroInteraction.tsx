/**
 * Card Component avec Micro-interactions
 * Version améliorée du Card avec animations subtiles au hover
 */

import * as React from "react";
import { Card, CardProps } from "./card";
import { cn } from "@/lib/utils";

interface CardWithMicroInteractionProps extends CardProps {
  /**
   * Activer l'animation au hover
   * @default true
   */
  enableHover?: boolean;
  /**
   * Type d'animation au hover
   * @default 'lift'
   */
  hoverAnimation?: 'lift' | 'scale' | 'glow';
}

/**
 * Card avec micro-interactions améliorées
 * 
 * @example
 * ```tsx
 * <CardWithMicroInteraction hoverAnimation="lift">
 *   <CardContent>Contenu</CardContent>
 * </CardWithMicroInteraction>
 * ```
 */
export const CardWithMicroInteraction = React.forwardRef<
  HTMLDivElement,
  CardWithMicroInteractionProps
>(({ 
  className,
  enableHover = true,
  hoverAnimation = 'lift',
  ...props 
}, ref) => {
  const hoverClasses = {
    lift: enableHover ? 'hover-lift transition-all duration-300' : '',
    scale: enableHover ? 'hover-scale transition-all duration-300' : '',
    glow: enableHover ? 'hover-glow transition-all duration-300' : '',
  }[hoverAnimation];

  return (
    <Card
      ref={ref}
      className={cn(hoverClasses, className)}
      {...props}
    />
  );
});

CardWithMicroInteraction.displayName = "CardWithMicroInteraction";







