/**
 * Button Component avec Micro-interactions
 * Version améliorée du Button avec animations subtiles et feedback haptique
 */

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { useMicroInteractions } from "@/hooks/useMicroInteractions";
import { cn } from "@/lib/utils";

interface ButtonWithMicroInteractionProps extends ButtonProps {
  /**
   * Type d'animation à utiliser
   * @default 'scale'
   */
  animation?: 'scale' | 'bounce' | 'pulse' | 'glow';
  /**
   * Activer le feedback haptique sur mobile
   * @default true
   */
  haptic?: boolean;
  /**
   * Type de feedback haptique
   * @default 'light'
   */
  hapticType?: 'light' | 'medium' | 'heavy';
}

/**
 * Button avec micro-interactions améliorées
 * 
 * @example
 * ```tsx
 * <ButtonWithMicroInteraction
 *   onClick={handleClick}
 *   animation="scale"
 *   haptic={true}
 * >
 *   Cliquer
 * </ButtonWithMicroInteraction>
 * ```
 */
export const ButtonWithMicroInteraction = React.forwardRef<
  HTMLButtonElement,
  ButtonWithMicroInteractionProps
>(({ 
  className,
  animation = 'scale',
  haptic = true,
  hapticType = 'light',
  ...props 
}, ref) => {
  const { interactionProps } = useMicroInteractions({
    haptic,
    hapticType,
    animation,
    duration: 150,
  });

  return (
    <Button
      ref={ref}
      className={cn(className)}
      {...interactionProps}
      {...props}
    />
  );
});

ButtonWithMicroInteraction.displayName = "ButtonWithMicroInteraction";

