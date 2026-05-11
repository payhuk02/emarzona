/**
 * Artist Form Field - Composant de champ avec validation en temps réel
 * Date: 31 Janvier 2025
 *
 * Composant réutilisable pour les champs de formulaire avec validation en temps réel
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  createAriaFieldAttributes,
  createAriaErrorAttributes,
  createAriaHintAttributes,
  createAriaLabelAttributes,
} from '@/lib/artist-product-accessibility';

interface ArtistFormFieldProps {
  id: string;
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  type?: 'text' | 'number' | 'url' | 'email' | 'date';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  multiline?: boolean;
  validationFn?: (value: string | number | null) => string | null;
  hint?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  showCharCount?: boolean;
  helpHint?: string;
  showHelpIcon?: boolean;
  validateOnChange?: boolean; // ✅ Nouvelle prop : désactive la validation en temps réel si false
}

export const ArtistFormField : React.FC<ArtistFormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  maxLength,
  min,
  max,
  step,
  rows = 3,
  multiline = false,
  validationFn,
  hint,
  className,
  onKeyDown,
  disabled = false,
  showCharCount = false,
  helpHint,
  showHelpIcon = false,
  validateOnChange = false, // ✅ Par défaut, pas de validation en temps réel
}) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // ✅ CORRECTION CRITIQUE: Utiliser un état local pour la valeur affichée
  // Permet une mise à jour immédiate sans attendre la mise à jour du parent
  const [localValue, setLocalValue] = useState(() => {
    return value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? value
        : value?.toString() || '';
  });

  // Synchroniser avec la prop value quand elle change de l'extérieur
  useEffect(() => {
    const newValue =
      value === null || value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : value?.toString() || '';

    // Ne mettre à jour que si la valeur vient de l'extérieur (pas de l'utilisateur)
    // On compare avec la valeur locale pour éviter les boucles infinies
    if (newValue !== localValue) {
      setLocalValue(newValue);
    }
  }, [value]); // Note: on ne met pas localValue dans les dépendances pour éviter les boucles

  // ✅ Validation en temps réel désactivée par défaut - validation uniquement au clic sur "Suivant"
  // Validation en temps réel avec debounce (uniquement si validateOnChange est true)
  useEffect(() => {
    if (!validateOnChange || !touched || !validationFn) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationError = validationFn(localValue || null);
      setError(validationError);
      setIsValidating(false);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [localValue, touched, validationFn, validateOnChange]);

  const handleBlur = () => {
    // ✅ Ne pas valider au blur si validateOnChange est false
    if (!validateOnChange) return;

    setTouched(true);
    if (validationFn) {
      const validationError = validationFn(localValue || null);
      setError(validationError);
    }
  };

  const handleChange = (newValue: string) => {
    // ✅ CORRECTION CRITIQUE: Mettre à jour l'état local immédiatement
    // Cela permet au champ de se mettre à jour visuellement sans délai
    setLocalValue(newValue);

    // Gérer les types number
    if (type === 'number') {
      const numValue = newValue === '' ? null : parseFloat(newValue);
      onChange(numValue);
    } else {
      // Appliquer maxLength si défini
      const finalValue =
        maxLength && newValue.length > maxLength ? newValue.substring(0, maxLength) : newValue;
      // Toujours passer la chaîne, même vide, pour éviter les problèmes de synchronisation
      onChange(finalValue === '' ? '' : finalValue);
    }
  };

  // ✅ Ne pas afficher les erreurs/succès si la validation en temps réel est désactivée
  const showError = validateOnChange && touched && error;
  const showSuccess = validateOnChange && touched && !error && localValue && !isValidating;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const labelId = `${id}-label`;

  // Attributs ARIA complets pour accessibilité
  const ariaAttributes = createAriaFieldAttributes({
    id,
    label,
    required,
    error: showError ? error : null,
    hint: !showError && hint ? hint : null,
    errorId,
    hintId,
  });

  const inputProps = {
    id,
    value: localValue, // ✅ Utilise l'état local pour mise à jour immédiate
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(e.target.value),
    onBlur: handleBlur,
    onKeyDown,
    placeholder,
    required,
    disabled: disabled || isValidating,
    maxLength: type !== 'number' ? maxLength : undefined,
    min: type === 'number' ? min : undefined,
    max: type === 'number' ? max : undefined,
    step: type === 'number' ? step : undefined,
    ...ariaAttributes,
    className: cn(
      'transition-all duration-200',
      showError && 'border-destructive focus-visible:ring-destructive',
      showSuccess && 'border-green-500 focus-visible:ring-green-500',
      isValidating && 'opacity-70',
      className
    ),
  };

  const labelAttributes = createAriaLabelAttributes(id, required);

  return (
    <div className="space-y-2" role="group" aria-labelledby={labelId}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} id={labelAttributes.id}>
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-label="requis">
                *
              </span>
            )}
          </Label>
          {(showHelpIcon || helpHint) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Aide pour ${label}`}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm whitespace-pre-line">{helpHint || `Aide pour ${label}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {showCharCount && maxLength && (
          <span
            className={cn(
              'text-xs',
              localValue.length > maxLength * 0.9 ? 'text-yellow-600' : 'text-muted-foreground'
            )}
          >
            {localValue.length} / {maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {multiline ? (
          <Textarea {...inputProps} rows={rows} />
        ) : (
          <Input {...inputProps} type={type} />
        )}

        {showSuccess && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in fade-in duration-200" />
        )}

        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showError && (
        <Alert
          variant="destructive"
          className="py-2 animate-in fade-in slide-in-from-top-1 duration-200"
          {...createAriaErrorAttributes(errorId)}
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <AlertDescription className="text-xs leading-relaxed">
            <span className="font-medium">{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {!showError && hint && (
        <div
          {...createAriaHintAttributes(hintId)}
          className="flex items-start gap-2 text-xs text-muted-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  );
};







