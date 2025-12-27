/**
 * MobileFormField - Champ de formulaire optimisé mobile-first
 * Gère automatiquement les labels, erreurs et espacements pour mobile
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectField,
} from './select';

interface MobileFormFieldProps {
  /**
   * Label du champ
   */
  label: string;
  /**
   * Nom du champ (pour l'accessibilité)
   */
  name?: string;
  /**
   * Erreur à afficher
   */
  error?: string;
  /**
   * Description/helper text
   */
  description?: string;
  /**
   * Requis ou non
   */
  required?: boolean;
  /**
   * Type de champ
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  /**
   * Options pour select
   */
  selectOptions?: Array<{ value: string; label: string }>;
  /**
   * Props à passer au champ
   */
  fieldProps?: Record<string, unknown>;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Valeur du champ
   */
  value?: string | number;
  /**
   * Callback de changement
   */
  onChange?: (value: string) => void;
}

/**
 * Composant de champ de formulaire mobile-first
 */
export const MobileFormField : React.FC<MobileFormFieldProps> = ({
  label,
  name,
  error,
  description,
  required = false,
  type = 'text',
  selectOptions = [],
  fieldProps = {},
  className,
  value,
  onChange,
}) => {
  const fieldId = name || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const renderField = () => {
    const commonProps = {
      id: fieldId,
      name: name || fieldId,
      'aria-invalid': !!error,
      'aria-describedby': error
        ? `${fieldId}-error`
        : description
          ? `${fieldId}-description`
          : undefined,
      className: cn('w-full', error && 'border-destructive focus-visible:ring-destructive'),
      ...fieldProps,
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={value as string}
            onChange={e => onChange?.(e.target.value)}
          />
        );

      case 'select':
        return (
          <SelectField
            label={label}
            value={value as string}
            onValueChange={onChange}
            error={error}
            description={description}
            required={required}
            placeholder={`Sélectionner ${label.toLowerCase()}`}
            className={className}
          >
            {selectOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectField>
        );

      default:
        return (
          <Input
            {...commonProps}
            type={type}
            value={value as string}
            onChange={e => onChange?.(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium',
          required && "after:content-['*'] after:ml-1 after:text-destructive"
        )}
      >
        {label}
      </Label>

      {description && (
        <p id={`${fieldId}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {renderField()}

      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Composant de section de formulaire mobile-first
 */
interface MobileFormSectionProps {
  /**
   * Titre de la section
   */
  title?: string;
  /**
   * Description de la section
   */
  description?: string;
  /**
   * Champs de la section
   */
  children: React.ReactNode;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
}

export const MobileFormSection : React.FC<MobileFormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4 p-4 sm:p-6 bg-card rounded-lg border', className)}>
      {(title || description) && (
        <div className="space-y-1 pb-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};







