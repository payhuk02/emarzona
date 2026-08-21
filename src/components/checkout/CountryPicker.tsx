import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CHECKOUT_DIAL_COUNTRIES,
  findDialCountry,
  flagUrlForIso,
  type DialCountry,
} from '@/lib/phone/country-dial';
import { cn } from '@/lib/utils';

export function CountryFlag({ iso, className }: { iso: string; className?: string }) {
  const code = iso.toLowerCase();
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const src =
    failedCode === code
      ? `https://flagcdn.com/w40/${code}.png`
      : flagUrlForIso(iso) || `https://flagcdn.com/${code}.svg`;

  return (
    <img
      key={code}
      src={src}
      alt=""
      aria-hidden="true"
      className={cn('h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm bg-muted', className)}
      onError={() => setFailedCode(code)}
    />
  );
}

type CountryPickerProps = {
  valueIso: string;
  onSelect: (country: DialCountry) => void;
  disabled?: boolean;
  compact?: boolean;
  error?: boolean;
  id?: string;
};

export function CountryPicker({
  valueIso,
  onSelect,
  disabled,
  compact = false,
  error,
  id,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const country = findDialCountry(valueIso);
  const items = useMemo(() => CHECKOUT_DIAL_COUNTRIES, []);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={
            compact
              ? `Indicatif ${country.name} +${country.dial}`
              : `Pays ${country.name} +${country.dial}`
          }
          title={`${country.name} (+${country.dial})`}
          disabled={disabled}
          className={cn(
            'h-11 min-h-11 rounded-xl border-border/70 bg-background font-normal shadow-none',
            'inline-flex items-center gap-2 hover:bg-background',
            compact
              ? 'w-[7.75rem] shrink-0 justify-between px-2 sm:w-[8.25rem] sm:px-2.5'
              : 'w-full justify-between px-3',
            error && 'border-destructive'
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CountryFlag iso={country.iso} />
            {compact ? (
              <span className="tabular-nums text-sm font-medium leading-none">+{country.dial}</span>
            ) : (
              <span className="min-w-0 truncate text-sm leading-none">
                {country.name}{' '}
                <span className="text-muted-foreground tabular-nums">+{country.dial}</span>
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="z-[1100] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0 pointer-events-auto"
        collisionPadding={16}
        onCloseAutoFocus={event => event.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Rechercher un pays ou un indicatif…" />
          <CommandList className="max-h-[min(20rem,50vh)]">
            <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item.iso}
                  value={`${item.name} ${item.iso} +${item.dial}`}
                  onPointerDown={event => event.preventDefault()}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <CountryFlag iso={item.iso} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="tabular-nums text-muted-foreground">+{item.dial}</span>
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      item.iso === country.iso ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
