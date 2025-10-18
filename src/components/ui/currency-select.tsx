import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const CurrencySelect = ({ value, onValueChange, disabled }: CurrencySelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une devise" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Devises africaines
        </div>
        {CURRENCIES.filter(c => ['XOF', 'XAF', 'NGN', 'GHS', 'KES', 'ZAR', 'MAD', 'TND', 'EGP', 'UGX', 'TZS', 'RWF'].includes(c.code)).map((currency) => (
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
        {CURRENCIES.filter(c => ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'JPY', 'CNY'].includes(c.code)).map((currency) => (
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
};
