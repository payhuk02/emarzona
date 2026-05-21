import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { formatFcfa } from '@/lib/format/fcfa';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';
import adaptEntrepreneurWebp from '@/assets/landing/adapt-entrepreneur.webp';
import adaptEntrepreneurPng from '@/assets/landing/adapt-entrepreneur.png';
import adaptSmartphoneWebp from '@/assets/landing/adapt-smartphone.webp';

export function AdaptSection() {
  const { t } = useLandingPremiumT();
  const { ref: textRef, className: textReveal } = usePremiumReveal();
  const benefits = t('adapt.benefits', { returnObjects: true }) as string[];

  return (
    <section className="lp-section-pad lp-section-muted">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-12 sm:px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="lp-adapt-visual relative mx-auto w-full max-w-md lg:max-w-none lg:mx-0">
          <div className="lp-adapt-photo relative overflow-hidden rounded-2xl shadow-[0_32px_64px_-32px_rgba(0,0,0,0.25)]">
            <picture>
              <source srcSet={adaptEntrepreneurWebp} type="image/webp" />
              <img
                src={adaptEntrepreneurPng}
                alt={t('adapt.photoAlt')}
                loading="eager"
                fetchpriority="high"
                width={900}
                height={1125}
                decoding="async"
              />
            </picture>
          </div>

          <div className="lp-adapt-phone pointer-events-none absolute -bottom-3 right-3 z-20 hidden sm:block sm:-right-4 sm:bottom-0">
            <img
              src={adaptSmartphoneWebp}
              alt=""
              className="h-[120px] w-[60px] object-cover object-top drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] sm:h-[168px] sm:w-[84px]"
              width={84}
              height={168}
              loading="lazy"
              decoding="async"
              aria-hidden
            />
          </div>

          <div className="absolute left-3 top-4 z-10 hidden rounded-xl border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:block sm:-left-5 sm:top-8 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--lp-text-muted)]">
              {t('adapt.cardRevenue')}
            </p>
            <p className="lp-serif mt-1 text-lg text-[var(--lp-text)] sm:text-2xl">
              {formatFcfa(18_726_000)}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600">{t('adapt.cardGrowth')}</p>
          </div>

          <div className="absolute bottom-20 right-3 z-10 hidden rounded-xl border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:block sm:-right-5 sm:bottom-28 sm:p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--lp-text-muted)]">
              {t('adapt.cardSatisfaction')}
            </p>
            <div className="mt-1 flex gap-0.5 text-[var(--lp-gold)]">
              {'★★★★★'.split('').map((s, i) => (
                <span key={i} className="text-sm">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--lp-text-muted)]">{t('adapt.cardReviews')}</p>
          </div>
        </div>

        <div ref={textRef} className={`min-w-0 lp-reveal ${textReveal}`}>
          <p className="lp-eyebrow-light mb-5">{t('adapt.eyebrow')}</p>
          <h2 className="lp-serif text-3xl text-[var(--lp-text)] sm:text-4xl lg:text-5xl">
            {t('adapt.title')}{' '}
            <span className="lp-gold-text italic">{t('adapt.titleHighlight')}</span>
          </h2>
          <p className="mt-5 text-[var(--lp-text-muted)] leading-relaxed">{t('adapt.subtitle')}</p>
          <ul className="mt-8 space-y-3">
            {benefits.map(b => (
              <li key={b} className="flex items-start gap-3 text-sm text-[var(--lp-text)]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--lp-blue)]/12">
                  <Check className="h-3 w-3 text-[var(--lp-blue)]" strokeWidth={2.5} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="lp-btn-primary inline-flex rounded-full px-7 py-3.5 text-sm font-semibold"
            >
              {t('adapt.ctaPrimary')}
            </Link>
            <Link
              to="/marketplace"
              className="lp-btn-outline-light inline-flex rounded-full px-7 py-3.5 text-sm"
            >
              {t('adapt.ctaSecondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
