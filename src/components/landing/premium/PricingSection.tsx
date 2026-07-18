import { Link } from 'react-router-dom';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { Check, Package, Layers } from 'lucide-react';
import { formatCurrencyCode } from '@/lib/currency-converter';
import {
  PHYSICAL_PLAN_BASE_CURRENCY,
  PHYSICAL_PLAN_PRICES_USD,
} from '@/lib/billing/platform-pricing';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

const physicalPlans = [
  {
    key: 'physicalBasic' as const,
    tier: '01',
    highlight: false,
    priceUsd: PHYSICAL_PLAN_PRICES_USD.basic,
  },
  {
    key: 'physicalStandard' as const,
    tier: '02',
    highlight: true,
    priceUsd: PHYSICAL_PLAN_PRICES_USD.standard,
  },
  {
    key: 'physicalPremium' as const,
    tier: '03',
    highlight: false,
    priceUsd: PHYSICAL_PLAN_PRICES_USD.premium,
  },
] as const;

function PricingCard({
  planKey,
  tier,
  highlight,
  priceUsd,
  t,
}: {
  planKey: (typeof physicalPlans)[number]['key'];
  tier: string;
  highlight: boolean;
  priceUsd: number;
  t: ReturnType<typeof useLandingPremiumT>['t'];
}) {
  const features = t(`pricing.${planKey}.features`, { returnObjects: true }) as string[];

  return (
    <div className="relative h-full pt-5">
      <span
        className={`absolute top-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          highlight
            ? 'bg-[var(--lp-gold)] text-[#0a0a0c]'
            : 'border border-white/15 bg-[#15151c] text-[var(--lp-gold-bright)]'
        }`}
      >
        {t(`pricing.${planKey}.badge`)}
      </span>

      <article
        className={`lp-pricing-dark relative flex h-full flex-col overflow-hidden rounded-2xl p-6 sm:p-7 ${
          highlight ? 'lp-pricing-dark--highlight' : ''
        }`}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-25 blur-3xl"
          style={{ background: highlight ? 'var(--lp-gold)' : 'var(--lp-purple)' }}
          aria-hidden
        />

        <div className="relative mb-4 flex items-start justify-between gap-3 pt-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Package className="h-5 w-5 text-[var(--lp-gold-bright)]" strokeWidth={1.5} />
          </div>
          <span className="lp-serif text-2xl text-white/25">{tier}</span>
        </div>

        <h3 className="relative text-lg font-semibold text-white">
          {t(`pricing.${planKey}.name`)}
        </h3>
        <p className="relative mt-2 min-h-[2.75rem] text-sm leading-relaxed text-white/70">
          {t(`pricing.${planKey}.desc`)}
        </p>

        <div className="relative mt-6 border-t border-white/10 pt-5">
          <p className="lp-serif text-3xl text-white sm:text-[2rem]">
            {formatCurrencyCode(priceUsd, PHYSICAL_PLAN_BASE_CURRENCY)}
            <span className="text-base font-sans text-white/60">{t('pricing.periodMonth')}</span>
          </p>
        </div>

        <ul className="relative mt-6 flex-1 space-y-2.5">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-white/90">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-gold-bright)]" />
              {f}
            </li>
          ))}
        </ul>

        <StoreCreateCtaLink
          className={`relative mt-8 inline-flex justify-center rounded-full py-3 text-sm font-semibold transition-transform active:scale-[0.98] ${
            highlight ? 'lp-btn-primary text-white' : 'lp-btn-outline-dark'
          }`}
        >
          {t(`pricing.${planKey}.cta`)}
        </StoreCreateCtaLink>
      </article>
    </div>
  );
}

export function PricingSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();

  const commissionFeatures = t('pricing.commission.features', {
    returnObjects: true,
  }) as string[];

  return (
    <section id="tarifs" className="lp-section-pad lp-section-light lp-pricing-section">
      <div ref={ref} className={`mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 lp-reveal ${className}`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="lp-eyebrow-light mx-auto mb-5">{t('pricing.eyebrow')}</p>
          <h2 className="lp-serif mt-3 text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            {t('pricing.title')}{' '}
            <span className="lp-gold-text italic">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--lp-text-muted)] sm:text-base">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lp-text-muted)]">
            {t('pricing.commissionGroupLabel')}
          </p>

          <div className="relative overflow-visible pt-1">
            <div className="relative pt-5">
              <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#15151c] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--lp-gold-bright)]">
                {t('pricing.commission.badge')}
              </span>

              <article className="lp-pricing-dark lp-pricing-commission relative overflow-hidden rounded-2xl p-6 sm:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
                  style={{ background: 'var(--lp-purple)' }}
                  aria-hidden
                />
                <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Layers className="h-7 w-7 text-[var(--lp-gold-bright)]" strokeWidth={1.5} />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold sm:text-2xl">
                      {t('pricing.commission.name')}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                      {t('pricing.commission.desc')}
                    </p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {commissionFeatures.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-gold-bright)]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-start gap-4 lg:items-end lg:text-right">
                    <p className="lp-serif text-4xl text-white">
                      10 %
                      <span className="block text-sm font-sans font-normal text-white/60">
                        {t('pricing.periodSale')}
                      </span>
                    </p>
                    <StoreCreateCtaLink className="lp-btn-primary inline-flex w-full justify-center rounded-full px-8 py-3 text-sm font-semibold lg:w-auto">
                      {t('pricing.commission.cta')}
                    </StoreCreateCtaLink>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <p className="mb-5 mt-12 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lp-text-muted)]">
            {t('pricing.physicalGroupLabel')}
          </p>

          <div className="grid gap-5 overflow-visible pt-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {physicalPlans.map(plan => (
              <PricingCard
                key={plan.key}
                planKey={plan.key}
                tier={plan.tier}
                highlight={plan.highlight}
                priceUsd={plan.priceUsd}
                t={t}
              />
            ))}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[var(--lp-text-muted)]">
          {t('pricing.footnote')}
        </p>
      </div>
    </section>
  );
}
