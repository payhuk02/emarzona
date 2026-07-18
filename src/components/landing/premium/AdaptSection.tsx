import { Link } from 'react-router-dom';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { Check } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePremiumReveal } from './usePremiumReveal';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import adaptPremiumWebp from '@/assets/landing/adapt-entrepreneur.webp';
import adaptPremiumPng from '@/assets/landing/adapt-entrepreneur.png';

export function AdaptSection() {
  const { t } = useLandingPremiumT();
  const { customizationData } = usePlatformCustomizationContext();
  const { ref: textRef, className: textReveal } = usePremiumReveal();
  const benefits = t('adapt.benefits', { returnObjects: true }) as string[];

  const customAdaptUrl = customizationData?.media?.images?.landingAdapt as string | undefined;
  const imgSrc = customAdaptUrl || adaptPremiumPng;

  return (
    <section className="lp-section-pad lp-section-muted">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-12 sm:px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="lp-adapt-visual relative mx-auto w-full lg:mx-0">
          <div className="lp-adapt-photo relative overflow-hidden rounded-2xl shadow-[0_32px_64px_-32px_rgba(0,0,0,0.25)]">
            <picture>
              {!customAdaptUrl && <source srcSet={adaptPremiumWebp} type="image/webp" />}
              <img
                src={imgSrc}
                alt={t('adapt.photoAlt')}
                loading="eager"
                fetchPriority="high"
                width={1024}
                height={686}
                sizes="(max-width: 1024px) 100vw, 50vw"
                decoding="async"
                data-no-mobile-opt
                className="lp-adapt-photo__img object-cover w-full h-full"
              />
            </picture>
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
            <StoreCreateCtaLink className="lp-btn-primary inline-flex rounded-full px-7 py-3.5 text-sm font-semibold">
              {t('adapt.ctaPrimary')}
            </StoreCreateCtaLink>
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
