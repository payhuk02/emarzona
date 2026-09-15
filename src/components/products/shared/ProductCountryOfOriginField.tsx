import { COUNTRIES, getCountryName } from '@/lib/countries';
import { SelectField, SelectItem } from '@/components/ui/select';

interface ProductCountryOfOriginFieldProps {
  value?: string | null;
  onChange: (code: string) => void;
  /** When true, label shows * and empty is invalid at step validation. */
  required?: boolean;
}

export function ProductCountryOfOriginField({
  value,
  onChange,
  required = false,
}: ProductCountryOfOriginFieldProps) {
  return (
    <SelectField
      label={required ? 'Pays d’origine *' : 'Pays d’origine'}
      contentVariant="sheet"
      useMobileSelectRoot
      value={value || undefined}
      onValueChange={onChange}
      required={required}
      placeholder="Sélectionnez un pays"
    >
      {COUNTRIES.map(country => (
        <SelectItem key={country.code} value={country.code}>
          {country.name}
        </SelectItem>
      ))}
    </SelectField>
  );
}

export function formatProductCountryLabel(code?: string | null): string {
  if (!code) return '';
  return getCountryName(code);
}
