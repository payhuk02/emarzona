import { Link } from 'react-router-dom';
import { Check, Package, Layers } from 'lucide-react';
import { formatFcfa } from '@/lib/format/fcfa';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';

const planConfig = [
  { key: 'physical' as const, icon: Package, highlight: true, price: 7_500 },
  { key: 'digital' as const, icon: Layers, highlight: false, priceLabel: '10 %' },
];

export function PricingSection() {
  const { t } = useLandingPremiumT();
  const { ref, className } = usePremiumReveal();

  return (
    <section id="tarifs" className="lp-section-pad lp-section-light">
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

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:mt-14 md:grid-cols-2">
          {planConfig.map(plan => {
            const features = t(`pricing.${plan.key}.features`, {
              returnObjects: true,
            }) as string[];
            const period =
              plan.key === 'physical' ? t('pricing.periodMonth') : t('pricing.periodSale');

            return (
              <article
                key={plan.key}
                className={`lp-pricing-card relative flex flex-col p-6 sm:p-8 ${
                  plan.highlight ? 'lp-pricing-card--highlight' : ''
                }`}
              >
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    plan.highlight
                      ? 'bg-[var(--lp-gold)] text-[#0a0a0c]'
                      : 'border border-[var(--lp-border-light)] bg-white text-[var(--lp-text-muted)]'
                  }`}
                >
                  {t(`pricing.${plan.key}.badge`)}
                </span>

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lp-gold)]/15 bg-[var(--lp-cream)]">
                  <plan.icon className="h-5 w-5 text-[var(--lp-gold-deep)]" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-semibold text-[var(--lp-text)]">
                  {t(`pricing.${plan.key}.name`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text-muted)]">
                  {t(`pricing.${plan.key}.desc`)}
                </p>

                <div className="mt-6">
                  {plan.price !== undefined ? (
                    <p className="lp-serif text-3xl text-[var(--lp-text)] sm:text-[2rem]">
                      {formatFcfa(plan.price)}
                      <span className="text-base font-sans text-[var(--lp-text-muted)]">
                        {period}
                      </span>
                    </p>
                  ) : (
                    <p className="lp-serif text-3xl text-[var(--lp-text)] sm:text-[2rem]">
                      {plan.priceLabel}
                      <span className="text-base font-sans text-[var(--lp-text-muted)]">
                        {' '}
                        {period}
                      </span>
                    </p>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--lp-text)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-gold-deep)]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`mt-8 inline-flex justify-center rounded-full py-3 text-sm font-semibold ${
                    plan.highlight ? 'lp-btn-primary text-white' : 'lp-btn-outline-light'
                  }`}
                >
                  {t(`pricing.${plan.key}.cta`)}
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[var(--lp-text-muted)]">
          {t('pricing.footnote')}
        </p>
      </div>
    </section>
  );
}
