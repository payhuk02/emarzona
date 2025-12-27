/**
 * Hook optimisé pour formulaires complexes
 * Améliore les performances avec useMemo, useCallback et debounce
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface UseOptimizedFormOptions<T> {
  /**
   * Valeurs initiales du formulaire
   */
  initialValues: T;
  
  /**
   * Fonction de validation
   */
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  
  /**
   * Callback appelé lors de la soumission
   */
  onSubmit?: (values: T) => void | Promise<void>;
  
  /**
   * Délai de debounce pour la validation (ms)
   * @default 300
   */
  validationDebounce?: number;
  
  /**
   * Activer la validation en temps réel
   * @default true
   */
  validateOnChange?: boolean;
  
  /**
   * Activer la validation au blur
   * @default true
   */
  validateOnBlur?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Hook optimisé pour formulaires complexes
 * 
 * @example
 * ```tsx
 * const { values, errors, handleChange, handleSubmit } = useOptimizedForm({
 *   initialValues: { name: '', email: '' },
 *   validate: (values) => {
 *     const errors = {};
 *     if (!values.name) errors.name = 'Required';
 *     if (!values.email) errors.email = 'Required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await saveForm(values);
 *   }
 * });
 * ```
 */
export function useOptimizedForm<T extends Record<string, any>>(
  options: UseOptimizedFormOptions<T>
) {
  const {
    initialValues,
    validate,
    onSubmit,
    validationDebounce = 300,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValidationRef = useRef<T>(initialValues);

  // Validation mémorisée
  const validateForm = useCallback(
    (values: T): Partial<Record<keyof T, string>> => {
      if (!validate) return {};
      return validate(values);
    },
    [validate]
  );

  // Validation avec debounce
  const debouncedValidate = useCallback(
    (values: T) => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      validationTimeoutRef.current = setTimeout(() => {
        const errors = validateForm(values);
        const isValid = Object.keys(errors).length === 0;
        
        setState((prev) => ({
          ...prev,
          errors,
          isValid,
        }));
        
        lastValidationRef.current = values;
      }, validationDebounce);
    },
    [validateForm, validationDebounce]
  );

  // Validation immédiate (sans debounce)
  const immediateValidate = useCallback(
    (values: T) => {
      const errors = validateForm(values);
      const isValid = Object.keys(errors).length === 0;
      
      setState((prev) => ({
        ...prev,
        errors,
        isValid,
      }));
    },
    [validateForm]
  );

  // Gestionnaire de changement optimisé
  const handleChange = useCallback(
    (name: keyof T) => (value: any) => {
      const newValues = { ...state.values, [name]: value };
      
      setState((prev) => ({
        ...prev,
        values: newValues,
        touched: { ...prev.touched, [name]: true },
      }));

      // Validation en temps réel si activée
      if (validateOnChange) {
        debouncedValidate(newValues);
      }
    },
    [state.values, validateOnChange, debouncedValidate]
  );

  // Gestionnaire de blur optimisé
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [name]: true },
      }));

      // Validation au blur si activée
      if (validateOnBlur) {
        immediateValidate(state.values);
      }
    },
    [state.values, validateOnBlur, immediateValidate]
  );

  // Gestionnaire de soumission optimisé
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Validation finale
      const errors = validateForm(state.values);
      const isValid = Object.keys(errors).length === 0;

      setState((prev) => ({
        ...prev,
        errors,
        isValid,
        touched: Object.keys(state.values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>
        ),
      }));

      if (!isValid || !onSubmit) return;

      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        await onSubmit(state.values);
      } catch (error) {
        logger.error('Form submission error', { 
          error: error instanceof Error ? error : new Error(String(error))
        });
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state.values, validateForm, onSubmit]
  );

  // Réinitialiser le formulaire
  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    });
    lastValidationRef.current = initialValues;
  }, [initialValues]);

  // Mettre à jour les valeurs (utile pour pré-remplir)
  const setValues = useCallback((newValues: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, ...newValues },
    }));
  }, []);

  // Valeurs mémorisées pour éviter les re-renders
  const memoizedValues = useMemo(() => state.values, [state.values]);
  const memoizedErrors = useMemo(() => state.errors, [state.errors]);
  const memoizedTouched = useMemo(() => state.touched, [state.touched]);

  // Nettoyer le timeout à la destruction
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return {
    values: memoizedValues,
    errors: memoizedErrors,
    touched: memoizedTouched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  };
}

/**
 * Hook pour gérer plusieurs champs de formulaire avec validation optimisée
 */
export function useFormField<T>(
  name: string,
  value: T,
  onChange: (value: T) => void,
  error?: string,
  touched?: boolean
) {
  const handleChange = useCallback(
    (newValue: T) => {
      onChange(newValue);
    },
    [onChange]
  );

  const hasError = touched && !!error;

  return {
    name,
    value,
    onChange: handleChange,
    error,
    hasError,
    touched: touched || false,
  };
}







