/**
 * useFormValidation Hook
 * Date: 28 Janvier 2025
 * 
 * Hook réutilisable pour la validation de formulaires avec debouncing
 * Améliore les performances et l'UX
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface ValidationRule<T = any> {
  validate: (value: T, formData?: Record<string, any>) => boolean | string;
  message?: string;
}

export interface FieldValidation {
  error: string | null;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

export interface UseFormValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Partial<Record<keyof T, ValidationRule[]>>,
  options: UseFormValidationOptions = {}
) {
  const {
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Valider un champ spécifique
  const validateField = useCallback(
    (fieldName: keyof T, value: T[keyof T]): string | null => {
      const fieldRules = rules[fieldName];
      if (!fieldRules || fieldRules.length === 0) return null;

      for (const rule of fieldRules) {
        const result = rule.validate(value, values);
        if (result !== true) {
          return typeof result === 'string' ? result : rule.message || 'Validation échouée';
        }
      }

      return null;
    },
    [rules, values]
  );

  // Valider tous les champs
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(values).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  // Mettre à jour la valeur d'un champ
  const setValue = useCallback(
    (fieldName: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      setDirty((prev) => ({ ...prev, [fieldName]: true }));

      // Valider avec debounce
      if (validateOnChange) {
        const timerKey = String(fieldName);
        
        // Annuler le timer précédent
        if (debounceTimerRef.current[timerKey]) {
          clearTimeout(debounceTimerRef.current[timerKey]);
        }

        // Créer un nouveau timer
        debounceTimerRef.current[timerKey] = setTimeout(() => {
          const error = validateField(fieldName, value);
          setErrors((prev) => {
            if (error) {
              return { ...prev, [fieldName]: error };
            } else {
              const { [fieldName]: _, ...rest } = prev;
              return rest;
            }
          });
        }, debounceMs);
      }
    },
    [validateOnChange, validateField, debounceMs]
  );

  // Gérer le blur d'un champ
  const handleBlur = useCallback(
    (fieldName: keyof T) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      if (validateOnBlur) {
        const error = validateField(fieldName, values[fieldName]);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [fieldName]: error };
          } else {
            const { [fieldName]: _, ...rest } = prev;
            return rest;
          }
        });
      }
    },
    [validateOnBlur, validateField, values]
  );

  // Réinitialiser le formulaire
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setDirty({});
    
    // Nettoyer les timers
    Object.values(debounceTimerRef.current).forEach((timer) => {
      clearTimeout(timer);
    });
    debounceTimerRef.current = {};
  }, [initialValues]);

  // Obtenir l'état de validation d'un champ
  const getFieldState = useCallback(
    (fieldName: keyof T): FieldValidation => {
      return {
        error: errors[fieldName] || null,
        isValid: !errors[fieldName],
        isDirty: dirty[fieldName] || false,
        isTouched: touched[fieldName] || false,
      };
    },
    [errors, dirty, touched]
  );

  // Vérifier si le formulaire est valide
  const isValid = Object.keys(errors).length === 0;
  const isDirty = Object.keys(dirty).length > 0;

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      Object.values(debounceTimerRef.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isDirty,
    setValue,
    setValues,
    handleBlur,
    validateField,
    validateAll,
    reset,
    getFieldState,
  };
}

// Règles de validation communes
export const commonRules = {
  required: (message = 'Ce champ est requis'): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (!value || value.length < min) {
        return message || `Minimum ${min} caractères requis`;
      }
      return true;
    },
    message: message || `Minimum ${min} caractères requis`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (value && value.length > max) {
        return message || `Maximum ${max} caractères autorisés`;
      }
      return true;
    },
    message: message || `Maximum ${max} caractères autorisés`,
  }),

  email: (message = 'Email invalide'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true; // Laisser required gérer les valeurs vides
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || message;
    },
    message,
  }),

  url: (message = 'URL invalide'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return message;
      }
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'number' && value < min) {
        return message || `La valeur doit être supérieure ou égale à ${min}`;
      }
      return true;
    },
    message: message || `La valeur doit être supérieure ou égale à ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'number' && value > max) {
        return message || `La valeur doit être inférieure ou égale à ${max}`;
      }
      return true;
    },
    message: message || `La valeur doit être inférieure ou égale à ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      return regex.test(value) || message;
    },
    message,
  }),
};

