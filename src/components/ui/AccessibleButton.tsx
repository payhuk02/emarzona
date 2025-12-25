/**
 * AccessibleButton Component
 * Date: 28 Janvier 2025
 * 
 * Version améliorée du Button avec meilleure accessibilité
 * Navigation clavier, ARIA labels, focus management
 */

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AccessibleButtonProps extends ButtonProps {
  /**
   * Label accessible pour les lecteurs d'écran
   * Si non fourni, utilise children si c'est une string
   */
  ariaLabel?: string;
  /**
   * Description détaillée pour les lecteurs d'écran
   */
  ariaDescription?: string;
  /**
   * Indique si le bouton contrôle un élément expansible
   */
  ariaExpanded?: boolean;
  /**
   * Indique si le bouton contrôle un élément
   */
  ariaControls?: string;
  /**
   * Indique l'état actuel du bouton (pressed, etc.)
   */
  ariaPressed?: boolean | "mixed";
  /**
   * Gestion personnalisée du focus
   */
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  /**
   * Gestion personnalisée du blur
   */
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  /**
   * Gestion personnalisée de la touche Enter
   */
  onEnter?: () => void;
  /**
   * Gestion personnalisée de la touche Escape
   */
  onEscape?: () => void;
  /**
   * Afficher un indicateur visuel de focus
   */
  showFocusIndicator?: boolean;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      ariaLabel,
      ariaDescription,
      ariaExpanded,
      ariaControls,
      ariaPressed,
      onFocus,
      onBlur,
      onEnter,
      onEscape,
      showFocusIndicator = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const combinedRef = React.useCallback(
      (node: HTMLButtonElement) => {
        buttonRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Générer aria-label automatiquement si non fourni
    const computedAriaLabel =
      ariaLabel ||
      (typeof children === "string" ? children : undefined) ||
      props["aria-label"];

    // Gestion des touches clavier
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        } else if (e.key === "Escape" && onEscape) {
          e.preventDefault();
          onEscape();
        } else if (e.key === " " && props.type !== "submit") {
          // Empêcher le scroll avec la barre d'espace sur les boutons
          e.preventDefault();
          if (!props.disabled) {
            buttonRef.current?.click();
          }
        }

        // Appeler le handler original s'il existe
        props.onKeyDown?.(e);
      },
      [onEnter, onEscape, props]
    );

    // Gestion du focus avec indicateur visuel
    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLButtonElement>) => {
        if (showFocusIndicator) {
          e.currentTarget.classList.add("ring-2", "ring-offset-2");
        }
        onFocus?.(e);
        props.onFocus?.(e);
      },
      [onFocus, props, showFocusIndicator]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLButtonElement>) => {
        if (showFocusIndicator) {
          e.currentTarget.classList.remove("ring-2", "ring-offset-2");
        }
        onBlur?.(e);
        props.onBlur?.(e);
      },
      [onBlur, props, showFocusIndicator]
    );

    return (
      <>
        <Button
          ref={combinedRef}
          className={cn(
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-all duration-200",
            className
          )}
          aria-label={computedAriaLabel}
          aria-describedby={ariaDescription ? `${props.id || "button"}-description` : undefined}
          aria-expanded={ariaExpanded}
          aria-controls={ariaControls}
          aria-pressed={ariaPressed}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        >
          {children}
        </Button>
        {ariaDescription && (
          <span
            id={`${props.id || "button"}-description`}
            className="sr-only"
          >
            {ariaDescription}
          </span>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

