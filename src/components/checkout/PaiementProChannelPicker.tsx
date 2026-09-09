/**
 * Choix du channel Paiement Pro — grille premium (cartes logo + label).
 * Mobile money filtré par pays acheteur ; WORLD (carte…) toujours proposés s’ils sont actifs.
 * @see https://dashboard.paiementpro.net/code-provider
 */
import { usePaymentRailsConfigPublic } from '@/hooks/admin/usePaymentRailsConfig';
import {
  PAIEMENT_PRO_OPERATORS,
  filterPaiementProOperatorsForBuyer,
  getDefaultPaiementProChannel,
  getEnabledOperators,
  mergePaymentRailsConfig,
  resolveBuyerCountryIso,
  type PaymentRailOperatorDef,
} from '@/lib/payments/payment-rails-catalog';
import { countryFromTimezone, findDialCountry, splitPhoneInput } from '@/lib/phone/country-dial';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

type BrandVisual = {
  /** Label court sous le logo (style premium) */
  shortLabel: string;
  /** Initiales / monogramme dans le cercle */
  mark: string;
  /** Classes Tailwind cercle */
  circle: string;
  /** Classes texte monogramme */
  markClass: string;
};

function brandVisual(op: PaymentRailOperatorDef): BrandVisual {
  const id = op.id;
  if (id.startsWith('OM') || id === 'OMCIV2') {
    return {
      shortLabel: 'Orange Money',
      mark: 'OM',
      circle: 'bg-[#FF7900]/10 ring-1 ring-[#FF7900]/25',
      markClass: 'text-[#E56A00] font-bold text-[11px] tracking-tight',
    };
  }
  if (
    id.startsWith('MOMO') ||
    id === 'MOMOCI' ||
    id === 'MOMOBJ' ||
    id === 'MOMOCM' ||
    id === 'MOMOGNF'
  ) {
    return {
      shortLabel: 'MTN MoMo',
      mark: 'MTN',
      circle: 'bg-[#FFCC00]/20 ring-1 ring-[#FFCC00]/40',
      markClass: 'text-[#1A1A1A] font-extrabold text-[10px] tracking-tight',
    };
  }
  if (id === 'FLOOZ' || id === 'FLOOZBJ' || id === 'MOOVTG') {
    return {
      shortLabel: id === 'MOOVTG' ? 'Flooz' : 'Moov Money',
      mark: id === 'MOOVTG' ? 'FL' : 'MV',
      circle: 'bg-[#0066B3]/10 ring-1 ring-[#0066B3]/25',
      markClass: 'text-[#0066B3] font-bold text-[11px]',
    };
  }
  if (id.startsWith('WAVE')) {
    return {
      shortLabel: 'Wave',
      mark: 'W',
      circle: 'bg-[#1DC8FF]/15 ring-1 ring-[#1DC8FF]/35',
      markClass: 'text-[#0AA8D8] font-bold text-sm',
    };
  }
  if (id === 'AIRTELNG') {
    return {
      shortLabel: 'Airtel Money',
      mark: 'AT',
      circle: 'bg-[#ED1C24]/10 ring-1 ring-[#ED1C24]/25',
      markClass: 'text-[#ED1C24] font-bold text-[11px]',
    };
  }
  if (id === 'TOGOCEL') {
    return {
      shortLabel: 'TogoCel',
      mark: 'TC',
      circle: 'bg-emerald-500/10 ring-1 ring-emerald-500/25',
      markClass: 'text-emerald-700 font-bold text-[11px]',
    };
  }
  if (id === 'CARD') {
    return {
      shortLabel: 'Visa / Mastercard',
      mark: 'V',
      circle: 'bg-blue-600/10 ring-1 ring-blue-600/20',
      markClass: 'text-blue-700 font-bold text-sm',
    };
  }
  if (id === 'PAYPAL') {
    return {
      shortLabel: 'PayPal',
      mark: 'PP',
      circle: 'bg-[#003087]/10 ring-1 ring-[#003087]/20',
      markClass: 'text-[#003087] font-bold text-[11px]',
    };
  }
  if (id === 'CRYPTO') {
    return {
      shortLabel: 'Crypto',
      mark: '₿',
      circle: 'bg-teal-500/15 ring-1 ring-teal-500/30',
      markClass: 'text-teal-700 font-bold text-base',
    };
  }
  if (id === 'TBANK') {
    return {
      shortLabel: 'Virement',
      mark: 'IB',
      circle: 'bg-slate-500/10 ring-1 ring-slate-400/30',
      markClass: 'text-slate-700 font-bold text-[11px]',
    };
  }
  return {
    shortLabel: op.label,
    mark: op.id.slice(0, 2),
    circle: 'bg-muted ring-1 ring-border',
    markClass: 'text-foreground font-semibold text-[11px]',
  };
}

/** Priorité : indicatif téléphone > pays formulaire > fuseau. */
function detectBuyerIso(buyerCountry?: string | null, buyerPhone?: string | null): string | null {
  const phone = (buyerPhone || '').trim();
  if (phone) {
    const parsed = splitPhoneInput(phone, buyerCountry);
    if (parsed.country?.iso) return parsed.country.iso.toUpperCase();
  }

  const fromForm = resolveBuyerCountryIso(buyerCountry);
  if (fromForm) return fromForm;

  const raw = (buyerCountry || '').trim();
  if (raw) {
    const dial = findDialCountry(raw);
    if (dial?.iso) return dial.iso.toUpperCase();
  }

  try {
    const tz =
      typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    const fromTz = countryFromTimezone(tz);
    return fromTz?.iso ? fromTz.iso.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function PaiementProChannelPicker({
  value,
  onChange,
  buyerCountry,
  buyerPhone,
  className,
}: {
  value?: string;
  onChange: (channel: string) => void;
  buyerCountry?: string | null;
  buyerPhone?: string | null;
  className?: string;
}) {
  const { data: rails } = usePaymentRailsConfigPublic();
  const config = rails ?? mergePaymentRailsConfig(null);
  const enabledIds = useMemo(() => getEnabledOperators(config, 'paiement_pro'), [config]);

  const buyerIso = useMemo(
    () => detectBuyerIso(buyerCountry, buyerPhone),
    [buyerCountry, buyerPhone]
  );

  const catalogForCountry = useMemo(() => {
    if (!buyerIso) return [];
    return PAIEMENT_PRO_OPERATORS.filter(
      op => op.kind === 'mobile' && (op.country || '').toUpperCase() === buyerIso
    );
  }, [buyerIso]);

  const options = useMemo(() => {
    const enabled = PAIEMENT_PRO_OPERATORS.filter(op => enabledIds.includes(op.id));
    return filterPaiementProOperatorsForBuyer(enabled, buyerIso);
  }, [enabledIds, buyerIso]);

  const logos = config.paiement_pro?.logos ?? {};

  useEffect(() => {
    if (options.length === 0) return;
    if (value && options.some(o => o.id === value)) return;
    onChange(
      getDefaultPaiementProChannel(
        config,
        options.map(o => o.id)
      )
    );
  }, [options, value, onChange, config]);

  const countryLabel = buyerIso
    ? catalogForCountry[0]?.countryLabel || findDialCountry(buyerIso).name
    : null;

  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  if (options.length === 0) {
    const disabledHere = catalogForCountry.filter(op => !enabledIds.includes(op.id));
    return (
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p>
          Aucun moyen Paiement Pro actif
          {countryLabel ? ` pour ${countryLabel}` : ' pour ce pays'}.
        </p>
        {disabledHere.length > 0 ? (
          <p className="text-xs">
            Disponible chez Paiement Pro mais désactivé en admin :{' '}
            {disabledHere.map(o => `${o.label} (${o.id})`).join(', ')}.
          </p>
        ) : (
          <p className="text-xs">
            Vérifiez le pays du téléphone ou activez les opérateurs concernés côté admin.
          </p>
        )}
      </div>
    );
  }

  const selected = value && options.some(o => o.id === value) ? value : options[0]?.id;

  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-sm font-medium text-foreground mb-3">
        Sélectionnez un moyen de paiement
        {countryLabel ? (
          <span className="font-normal text-muted-foreground"> — {countryLabel}</span>
        ) : null}
        :
      </p>

      <div
        role="radiogroup"
        aria-label="Moyen Paiement Pro"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      >
        {options.map(op => {
          const isOn = selected === op.id;
          const brand = brandVisual(op);
          const countrySuffix = op.country && op.country !== 'WORLD' ? op.country : null;
          const logoUrl = logos[op.id];
          const showLogo = Boolean(logoUrl) && !brokenLogos[op.id];

          return (
            <button
              key={op.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={op.label}
              title={op.label}
              onClick={() => onChange(op.id)}
              className={cn(
                'group flex flex-col items-center justify-center gap-2 rounded-xl border bg-background px-2 py-3.5 sm:py-4',
                'min-w-0 w-full transition-all duration-200 outline-none',
                'hover:border-muted-foreground/35 hover:bg-muted/30',
                'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                isOn
                  ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary))] bg-primary/[0.03]'
                  : 'border-border/80'
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full overflow-hidden',
                  showLogo ? 'bg-white ring-1 ring-border/70 p-1.5' : brand.circle
                )}
                aria-hidden
              >
                {showLogo ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={() => setBrokenLogos(prev => ({ ...prev, [op.id]: true }))}
                  />
                ) : (
                  <span className={brand.markClass}>{brand.mark}</span>
                )}
              </span>

              <span className="flex flex-col items-center gap-0.5 px-0.5 text-center min-w-0 w-full">
                <span
                  className={cn(
                    'text-[12px] sm:text-[13px] font-medium leading-tight text-foreground',
                    'line-clamp-2'
                  )}
                >
                  {brand.shortLabel}
                </span>
                {countrySuffix ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {countrySuffix}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
