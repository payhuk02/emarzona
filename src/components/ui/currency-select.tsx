/**
 * Composant de sélection de devise
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */

import { memo, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currencies';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const AFRICAN_CURRENCIES = ['XOF', 'XAF', 'NGN', 'GHS', 'KES', 'ZAR', 'MAD', 'TND', 'EGP', 'UGX', 'TZS', 'RWF'];
const INTERNATIONAL_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'JPY', 'CNY'];

export const CurrencySelect = memo(({ value, onValueChange, disabled }: CurrencySelectProps) => {
  const africanCurrencies = useMemo(
    () => CURRENCIES.filter(c => AFRICAN_CURRENCIES.includes(c.code)),
    []
  );

  const internationalCurrencies = useMemo(
    () => CURRENCIES.filter(c => INTERNATIONAL_CURRENCIES.includes(c.code)),
    []
  );

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une devise" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Devises africaines
        </div>
        {africanCurrencies.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.name}</span>
              <span className="text-muted-foreground">({currency.symbol})</span>
            </span>
          </SelectItem>
        ))}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
          Devises internationales
        </div>
        {internationalCurrencies.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.name}</span>
              <span className="text-muted-foreground">({currency.symbol})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

CurrencySelect.displayName = 'CurrencySelect';






