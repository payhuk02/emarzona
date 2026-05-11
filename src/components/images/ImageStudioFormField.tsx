/**
 * <ImageStudioFormField />
 *
 * Variante react-hook-form du <ImageStudioField />.
 *
 * Branche automatiquement le champ via `useController` :
 *  - récupère `value` / `onChange` sans `<Controller render={...}>`
 *  - transmet automatiquement `name` en tant que `fieldName` pour la détection de contexte
 *  - pas besoin de passer `context` ni `fieldName` manuellement
 *
 * Usage :
 *   <ImageStudioFormField name="image_produit" control={control} />
 *   <ImageStudioFormField name="photoProfilUrl" control={control} label="Avatar" />
 */

import React from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import {
  ImageStudioField,
  type ImageStudioFieldProps,
} from './ImageStudioField';

export interface ImageStudioFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ImageStudioFieldProps, 'value' | 'onChange' | 'fieldName'> {
  name: TName;
  control: Control<TFieldValues>;
  /** Surcharge le nom utilisé pour la détection du contexte (par défaut = name). */
  fieldName?: string;
}

export function ImageStudioFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  fieldName,
  ...rest
}: ImageStudioFormFieldProps<TFieldValues, TName>) {
  const {
    field: { value, onChange },
  } = useController({ name, control });

  return (
    <ImageStudioField
      {...rest}
      value={(value as string | null | undefined) ?? ''}
      onChange={onChange}
      // Auto-transmission du nom réel du champ RHF vers la détection
      fieldName={fieldName ?? String(name)}
    />
  );
}

export default ImageStudioFormField;
