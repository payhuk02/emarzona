/**
 * Composant SelectField - Select avec gestion d'erreurs et validation intégrée
 *
 * Encapsule Select avec :
 * - Gestion d'erreurs standardisée
 * - Accessibilité complète (ARIA)
 * - Feedback visuel pour les erreurs
 * - Support des états loading et disabled
 *
 * @example
 * ```tsx
 * <SelectField
 *   label="Catégorie"
 *   value={value}
 *   onValueChange={setValue}
 *   error={errors.category}
 *   required
 * >
 *   <SelectItem value="1">Option 1</SelectItem>
 *   <SelectItem value="2">Option 2</SelectItem>
 * </SelectField>
 * ```
 */

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileSelect, type MobileSelectHandle } from './mobile-select';

export interface SelectFieldProps {
  /**
   * Label du champ
   */
  label: string;
  /**
   * Valeur sélectionnée
   */
  value?: string;
  /**
   * Callback quand la valeur change
   */
  onValueChange?: (value: string) => void;
  /**
   * Message d'erreur à afficher
   */
  error?: string;
  /**
   * Description ou hint
   */
  description?: string;
  /**
   * Champ requis
   */
  required?: boolean;
  /**
   * Champ désactivé
   */
  disabled?: boolean;
  /**
   * État de chargement
   */
  loading?: boolean;
  /**
   * Placeholder
   */
  placeholder?: string;
  /**
   * ID du champ (généré automatiquement si non fourni)
   */
  id?: string;
  /**
   * Classes CSS supplémentaires pour le conteneur
   */
  className?: string;
  /**
   * Classes CSS supplémentaires pour le SelectTrigger
   */
  triggerClassName?: string;
  /**
   * Enfants (SelectItem)
   */
  children: React.ReactNode;
  /**
   * Variante visuelle du contenu sur mobile (dropdown classique ou bottom sheet).
   * Par défaut "sheet" (bottom sheet mobile).
   */
  contentVariant?: 'default' | 'sheet';
  /**
   * Utiliser MobileSelect comme Root pour bénéficier de l'API impérative (open/close/toggle)
   * et d'une gestion mobile encore plus robuste. Ne change pas le rendu visuel.
   */
  useMobileSelectRoot?: boolean;
  /**
   * Ref impérative optionnelle pour contrôler l'ouverture/fermeture via MobileSelect.
   * Nécessite useMobileSelectRoot = true pour être utilisée.
   */
  mobileHandleRef?: React.Ref<MobileSelectHandle>;
  /**
   * Aria-label personnalisé
   */
  'aria-label'?: string;
}

export const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(
  (
    {
      label,
      value,
      onValueChange,
      error,
      description,
      required = false,
      disabled = false,
      loading = false,
      placeholder = 'Sélectionner...',
      id,
      className,
      triggerClassName,
      contentVariant = 'sheet',
      useMobileSelectRoot = false,
      mobileHandleRef,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const fieldId = React.useId();
    const finalId = id || fieldId;
    const errorId = `${finalId}-error`;
    const descriptionId = `${finalId}-description`;
    const hasError = !!error;

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        <Label htmlFor={finalId} className="text-xs sm:text-sm">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {/* Select Root (standard ou MobileSelect) */}
        {useMobileSelectRoot ? (
          <MobileSelect
            value={value}
            onValueChange={onValueChange}
            disabled={disabled || loading}
            ref={mobileHandleRef}
          >
            <SelectTrigger
              ref={ref}
              id={finalId}
              error={error}
              errorId={errorId}
              className={triggerClassName}
              aria-label={ariaLabel || label}
              aria-describedby={hasError ? errorId : description ? descriptionId : undefined}
              {...props}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent mobileVariant={contentVariant}>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                children
              )}
            </SelectContent>
          </MobileSelect>
        ) : (
          <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
            <SelectTrigger
              ref={ref}
              id={finalId}
              error={error}
              errorId={errorId}
              className={triggerClassName}
              aria-label={ariaLabel || label}
              aria-describedby={hasError ? errorId : description ? descriptionId : undefined}
              {...props}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent mobileVariant={contentVariant}>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                children
              )}
            </SelectContent>
          </Select>
        )}

        {/* Description */}
        {!hasError && description && (
          <p id={descriptionId} className="text-xs text-muted-foreground" aria-live="polite">
            {description}
          </p>
        )}

        {/* Message d'erreur */}
        {hasError && (
          <div
            id={errorId}
            className="flex items-start gap-2 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';






