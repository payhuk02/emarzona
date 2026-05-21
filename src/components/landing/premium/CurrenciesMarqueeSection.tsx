import { LANDING_CURRENCIES, type LandingCurrency } from '@/lib/landing/currencies';
import { getCurrencyLogoUrl } from '@/lib/landing/currency-logo';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

function CurrencyChip({ currency }: { currency: LandingCurrency }) {
  const { t } = useLandingPremiumT();
  const logoSrc = getCurrencyLogoUrl(currency.code);
  const name = t(`currencies.names.${currency.code}`);
  const region = t(`countries.regions.${currency.regionKey}`);

  return (
    <div
      className="lp-currency-chip mx-2 flex shrink-0 items-center gap-3 rounded-full border border-[var(--lp-border-light)] bg-white px-4 py-2.5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] sm:mx-3 sm:gap-3.5 sm:px-5 sm:py-3"
      title={`${name} (${currency.code})`}
    >
      <span className="lp-currency-logo-wrap shrink-0 overflow-hidden rounded-full border border-[var(--lp-border-light)] bg-[var(--lp-surface-muted)] shadow-sm">
        <span
          className="lp-currency-logo-img block h-9 w-9 sm:h-10 sm:w-10"
          style={{ backgroundImage: `url(${logoSrc})` }}
          role="img"
          aria-label={name}
        />
      </span>
      <div className="min-w-0 pr-1">
        <p className="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--lp-text)] sm:text-[15px]">
          {currency.code}
          <span className="ml-1.5 font-medium text-[var(--lp-text-muted)]">{currency.symbol}</span>
        </p>
        <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[var(--lp-text-muted)]">
          {name}
        </p>
      </div>
      <span className="sr-only">
        {name} — {region}
      </span>
    </div>
  );
}

function CurrencyMarqueeRow({
  currencies,
  reverse = false,
}: {
  currencies: LandingCurrency[];
  reverse?: boolean;
}) {
  const track = [...currencies, ...currencies];

  return (
    <div className="lp-currencies-marquee-mask relative">
      <div
        className={`lp-currencies-marquee-track flex w-max items-center ${reverse ? 'lp-currencies-marquee-track--reverse' : ''}`}
      >
        {track.map((currency, i) => (
          <CurrencyChip key={`${currency.code}-${i}`} currency={currency} />
        ))}
      </div>
    </div>
  );
}

export function CurrenciesMarqueeSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();
  const count = LANDING_CURRENCIES.length;

  const rowA = LANDING_CURRENCIES;
  const rowB = [...LANDING_CURRENCIES].reverse();

  return (
    <section
      id="devises"
      className="lp-currencies-section relative overflow-hidden border-y border-[var(--lp-border-light)] bg-[var(--lp-surface-muted)] py-14 sm:py-20"
    >
      <div className="relative">
        <div ref={ref} className={`lp-reveal ${className}`}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-5">
            <p className="lp-eyebrow-light mx-auto mb-5">{t('currencies.eyebrow')}</p>
            <h2 className="lp-serif text-2xl text-[var(--lp-text)] sm:text-3xl lg:text-4xl">
              {t('currencies.titleLine1')}
              <br />
              <span className="lp-gold-text italic">{t('currencies.titleHighlight')}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
              {t('currencies.subtitle', { count })}
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-5 sm:mt-12 sm:space-y-6">
          <CurrencyMarqueeRow currencies={rowA} />
          <CurrencyMarqueeRow currencies={rowB} reverse />
        </div>
      </div>
    </section>
  );
}
