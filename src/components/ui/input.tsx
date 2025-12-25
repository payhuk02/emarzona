import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * ID de l'élément qui décrit ce champ (pour aria-describedby)
   * Utile pour connecter les messages d'erreur ou d'aide
   */
  "aria-describedby"?: string;
  /**
   * Indique si le champ est invalide (pour aria-invalid)
   * Sera automatiquement défini à true si une erreur est présente
   */
  "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling";
  /**
   * Message d'erreur à afficher
   * Si fourni, aria-invalid sera automatiquement défini à true
   */
  error?: string;
  /**
   * ID pour le message d'erreur (généré automatiquement si non fourni)
   */
  errorId?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorId, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...props }, ref) => {
    // Générer un ID unique pour le message d'erreur si nécessaire
    const generatedErrorId = React.useId();
    const finalErrorId = errorId || (error ? `${generatedErrorId}-error` : undefined);
    
    // Construire aria-describedby avec l'erreur si présente
    const describedBy = React.useMemo(() => {
      const ids: string[] = [];
      if (ariaDescribedBy) ids.push(ariaDescribedBy);
      if (finalErrorId && error) ids.push(finalErrorId);
      return ids.length > 0 ? ids.join(' ') : undefined;
    }, [ariaDescribedBy, finalErrorId, error]);
    
    // aria-invalid doit être true si une erreur est présente
    const isInvalid = error ? true : (ariaInvalid === true || ariaInvalid === "true");
    
    return (
      <>
        <input
          type={type}
          className={cn(
            "flex min-h-[44px] h-11 w-full max-w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-xs sm:file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={isInvalid}
          {...props}
        />
        {error && finalErrorId && (
          <p
            id={finalErrorId}
            className="mt-1 text-sm font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
