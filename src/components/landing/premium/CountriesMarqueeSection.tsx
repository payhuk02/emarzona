import { LANDING_COUNTRIES } from '@/lib/landing/countries';
import { getCountryFlagUrl } from '@/lib/landing/country-flag';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

function CountryChip({ code, regionKey }: { code: string; regionKey: string }) {
  const { t } = useLandingPremiumT();
  const flagSrc = getCountryFlagUrl(code);
  const name = t(`countries.names.${code}`);
  const region = t(`countries.regions.${regionKey}`);

  return (
    <div
      className="lp-country-chip mx-2 flex shrink-0 items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 backdrop-blur-md sm:mx-3 sm:gap-3.5 sm:px-5 sm:py-3"
      title={name}
    >
      <span className="lp-country-flag-wrap shrink-0 overflow-hidden rounded-md border border-white/15 shadow-sm">
        <span
          className="lp-country-flag-img block h-7 w-10 sm:h-8 sm:w-[46px]"
          style={{ backgroundImage: `url(${flagSrc})` }}
          role="img"
          aria-label={name}
        />
      </span>
      <div className="min-w-0 pr-1">
        <p className="whitespace-nowrap text-sm font-medium tracking-tight text-white/95 sm:text-[15px]">
          {name}
        </p>
        <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-white/40">
          {region}
        </p>
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}

function CountryMarqueeRow({
  countries,
  reverse = false,
}: {
  countries: typeof LANDING_COUNTRIES;
  reverse?: boolean;
}) {
  const track = [...countries, ...countries];

  return (
    <div className="lp-countries-marquee-mask relative">
      <div
        className={`lp-countries-marquee-track flex w-max items-center ${reverse ? 'lp-countries-marquee-track--reverse' : ''}`}
      >
        {track.map((country, i) => (
          <CountryChip
            key={`${country.code}-${i}`}
            code={country.code}
            regionKey={country.regionKey}
          />
        ))}
      </div>
    </div>
  );
}

export function CountriesMarqueeSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();
  const count = LANDING_COUNTRIES.length;

  const rowA = LANDING_COUNTRIES;
  const rowB = [...LANDING_COUNTRIES].reverse();

  return (
    <section
      id="pays"
      className="lp-countries-section relative overflow-hidden border-y border-white/[0.06] bg-[#08080a] py-14 sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(37,99,235,0.14) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(201,162,39,0.08) 0%, transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative">
        <div ref={ref} className={`lp-reveal ${className}`}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-5">
            <p className="lp-eyebrow mx-auto mb-5">{t('countries.eyebrow')}</p>
            <h2 className="lp-serif text-2xl text-white sm:text-3xl lg:text-4xl">
              {t('countries.titleLine1')}
              <br />
              <span className="lp-gold-text italic">
                {t('countries.titleHighlight', { count })}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--lp-text-dim)] sm:text-base">
              {t('countries.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-5 sm:mt-12 sm:space-y-6">
          <CountryMarqueeRow countries={rowA} />
          <CountryMarqueeRow countries={rowB} reverse />
        </div>
      </div>
    </section>
  );
}
