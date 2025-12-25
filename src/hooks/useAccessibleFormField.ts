/**
 * Hook pour créer des champs de formulaire accessibles
 * Gère automatiquement aria-describedby et aria-invalid
 * 
 * @example
 * ```tsx
 * const { inputProps, errorId, descriptionId } = useAccessibleFormField({
 *   id: 'email',
 *   error: errors.email,
 *   description: 'Votre adresse email sera utilisée pour la connexion',
 * });
 * 
 * <Input {...inputProps} />
 * <FormFieldValidation id={errorId} error={errors.email} />
 * ```
 */

import { useId, useMemo } from 'react';

export interface UseAccessibleFormFieldOptions {
  /**
   * ID de base pour le champ (sera utilisé pour générer les IDs des messages)
   */
  id?: string;
  /**
   * Message d'erreur à afficher
   */
  error?: string | null;
  /**
   * Message d'aide/description
   */
  description?: string | null;
  /**
   * Message de succès
   */
  success?: string | null;
  /**
   * Indique si le champ est requis
   */
  required?: boolean;
}

export interface UseAccessibleFormFieldReturn {
  /**
   * Props à passer au composant Input
   */
  inputProps: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid': boolean;
    'aria-required'?: boolean;
  };
  /**
   * ID pour le message d'erreur (à utiliser avec FormFieldValidation)
   */
  errorId: string;
  /**
   * ID pour le message de description (à utiliser avec FormFieldValidation)
   */
  descriptionId: string;
  /**
   * ID pour le message de succès (à utiliser avec FormFieldValidation)
   */
  successId: string;
  /**
   * ID combiné pour aria-describedby (inclut description et error si présents)
   */
  describedBy: string | undefined;
}

export function useAccessibleFormField(
  options: UseAccessibleFormFieldOptions = {}
): UseAccessibleFormFieldReturn {
  const {
    id: baseId,
    error,
    description,
    success,
    required = false,
  } = options;

  const generatedId = useId();
  const fieldId = baseId || generatedId;
  
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const successId = `${fieldId}-success`;

  const describedBy = useMemo(() => {
    const ids: string[] = [];
    if (description) ids.push(descriptionId);
    if (error) ids.push(errorId);
    if (success && !error) ids.push(successId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [description, error, success, descriptionId, errorId, successId]);

  const inputProps = useMemo(() => ({
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': !!error,
    'aria-required': required || undefined,
  }), [fieldId, describedBy, error, required]);

  return {
    inputProps,
    errorId,
    descriptionId,
    successId,
    describedBy,
  };
}

