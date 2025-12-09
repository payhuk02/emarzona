/**
 * Composant FormFieldWithValidation - Champ de formulaire avec validation en temps réel
 * Date: 31 Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldWithValidationProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  validateOnChange?: boolean;
  validationRules?: Array<(value: string) => string | null>;
}

export const FormFieldWithValidation: React.FC<FormFieldWithValidationProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  validateOnChange = true,
  validationRules = [],
}) => {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validation en temps réel
  useEffect(() => {
    if (!validateOnChange || !touched) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      let validationError: string | null = null;

      // Validation required
      if (required && !value.trim()) {
        validationError = `${label} est requis`;
      }

      // Validation rules
      if (!validationError && validationRules.length > 0) {
        for (const rule of validationRules) {
          const ruleError = rule(value);
          if (ruleError) {
            validationError = ruleError;
            break;
          }
        }
      }

      setLocalError(validationError);
      setIsValidating(false);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [value, touched, required, label, validationRules, validateOnChange]);

  const handleBlur = () => {
    setTouched(true);
    if (onBlur) {
      onBlur();
    }
  };

  const displayError = error || localError;
  const showError = touched && displayError;
  const showSuccess = touched && !displayError && value.trim() && !isValidating;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "transition-all duration-200",
            showError && "border-destructive focus-visible:ring-destructive",
            showSuccess && "border-green-500 focus-visible:ring-green-500",
            isValidating && "opacity-70"
          )}
          aria-invalid={showError}
          aria-describedby={showError ? `${name}-error` : undefined}
        />
        {showSuccess && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      {showError && (
        <Alert variant="destructive" className="py-2" id={`${name}-error`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

