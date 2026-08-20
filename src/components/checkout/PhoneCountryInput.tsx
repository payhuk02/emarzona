import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { CountryPicker } from '@/components/checkout/CountryPicker';
import {
  combineLocalPhone,
  countryFromTimezone,
  findDialCountry,
  splitPhoneInput,
} from '@/lib/phone/country-dial';
import { cn } from '@/lib/utils';

export type PhoneCountryInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (fullPhone: string) => void;
  onCountryNameChange?: (countryName: string) => void;
  onCountryIsoChange?: (iso: string) => void;
  countryHint?: string;
  /** ISO contrôlé (ex. formulaire retrait) — le sélecteur reste synchronisé. */
  countryIso?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function PhoneCountryInput({
  id = 'phone',
  name = 'phone',
  value,
  onChange,
  onCountryNameChange,
  onCountryIsoChange,
  countryHint,
  countryIso,
  error,
  required,
  disabled,
  className,
}: PhoneCountryInputProps) {
  const initial = useMemo(
    () => splitPhoneInput(value, countryIso || countryHint),
    // Seed from the first non-empty hint / stored phone only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const lastEmitted = useRef(value);
  const [iso, setIso] = useState(initial.country.iso);
  const [localNumber, setLocalNumber] = useState(initial.localNumber);
  const isCountryControlled = Boolean(countryIso);

  const effectiveIso = isCountryControlled ? findDialCountry(countryIso).iso : iso;
  const country = findDialCountry(effectiveIso);

  useEffect(() => {
    if (isCountryControlled) return;
    if (value) return;
    if (countryHint) {
      setIso(findDialCountry(countryHint).iso);
      return;
    }
    const tz =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    setIso(countryFromTimezone(tz).iso);
  }, [countryHint, value, isCountryControlled]);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    if (!value) {
      setLocalNumber('');
      return;
    }
    const parsed = splitPhoneInput(value, countryIso || countryHint || iso);
    if (!isCountryControlled) setIso(parsed.country.iso);
    setLocalNumber(parsed.localNumber);
  }, [value, countryHint, countryIso, iso, isCountryControlled]);

  const emit = (nextIso: string, nextLocal: string) => {
    const nextCountry = findDialCountry(nextIso);
    const full = combineLocalPhone(nextCountry.dial, nextLocal);
    lastEmitted.current = full;
    if (!isCountryControlled) setIso(nextCountry.iso);
    onChange(full);
    onCountryNameChange?.(nextCountry.name);
    onCountryIsoChange?.(nextCountry.iso.toUpperCase());
  };

  const inputClass =
    'min-h-11 h-11 text-base rounded-xl border-border/70 bg-background transition-[box-shadow,border-color] focus-visible:border-foreground/30 focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_hsl(var(--foreground)/0.06)]';

  return (
    <div className={cn('flex w-full min-w-0 items-center gap-2', className)}>
      <CountryPicker
        valueIso={effectiveIso}
        compact
        disabled={disabled}
        error={Boolean(error)}
        onSelect={next => {
          emit(next.iso, localNumber);
        }}
      />
      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        value={localNumber}
        placeholder={country.iso === 'bf' || country.iso === 'ci' ? '70 12 34 56' : 'Numéro local'}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, 'min-w-0 flex-1', error ? 'border-destructive' : '')}
        onChange={e => {
          const pasted = e.target.value.trim();
          if (pasted.startsWith('+')) {
            const parsed = splitPhoneInput(pasted, country.name);
            setLocalNumber(parsed.localNumber);
            emit(parsed.country.iso, parsed.localNumber);
            return;
          }
          const nextLocal = e.target.value.replace(/[^\d\s]/g, '');
          setLocalNumber(nextLocal);
          emit(effectiveIso, nextLocal);
        }}
      />
    </div>
  );
}
