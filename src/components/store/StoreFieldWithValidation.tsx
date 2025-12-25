/**
 * StoreFieldWithValidation Component
 * Composant helper pour afficher des champs avec validation en temps réel
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreFieldWithValidationProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'url' | 'tel';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  touched?: boolean;
  validateOnBlur?: boolean;
  validationFn?: (value: string) => string | null;
  hint?: string;
  className?: string;
}

export const StoreFieldWithValidation: React.FC<StoreFieldWithValidationProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  touched: externalTouched,
  validateOnBlur = true,
  validationFn,
  hint,
  className,
}) => {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const isTouched = externalTouched !== undefined ? externalTouched : touched;
  const error = externalError || localError;

  // Validation en temps réel avec debounce
  useEffect(() => {
    if (!validateOnBlur || !isTouched || !validationFn) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationError = validationFn(value);
      setLocalError(validationError);
      setIsValidating(false);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [value, isTouched, validateOnBlur, validationFn]);

  const handleBlur = () => {
    if (externalTouched === undefined) {
      setTouched(true);
    }
    if (validationFn && isTouched) {
      const validationError = validationFn(value);
      setLocalError(validationError);
    }
    if (onBlur) {
      onBlur();
    }
  };

  const showError = isTouched && error;
  const showSuccess = isTouched && !error && value.trim() && !isValidating;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isValidating}
          error={showError ? error : undefined}
          errorId={errorId}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : hint ? hintId : undefined}
          className={cn(
            "transition-all duration-200",
            showError && "border-destructive focus-visible:ring-destructive",
            showSuccess && "border-green-500 focus-visible:ring-green-500",
            isValidating && "opacity-70"
          )}
        />
        {showSuccess && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in fade-in duration-200" />
        )}
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {showError && (
        <Alert variant="destructive" className="py-2 animate-in fade-in slide-in-from-top-1 duration-200" id={errorId} role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {!showError && hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
};

