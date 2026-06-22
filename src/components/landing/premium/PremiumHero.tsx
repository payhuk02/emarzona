import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Zap, Headphones } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';

const PremiumHeroVisual = lazy(() =>
  import('./PremiumHeroVisual').then(m => ({ default: m.PremiumHeroVisual }))
);

const trustIcons = [CreditCard, Zap, Headphones] as const;
const trustKeys = ['noCard', 'instant', 'support'] as const;

function HeroVisualFallback() {
  return (
    <div
      className="lp-hero-visual-fallback mx-auto aspect-[2/3] w-full max-w-[min(100%,480px)] lg:max-w-[min(100%,520px)]"
      aria-hidden
    />
  );
}

export function PremiumHero() {
  const { t } = useLandingPremiumT();

  return (
    <section className="lp-hero relative overflow-hidden bg-[#08080a] pt-16 text-[var(--lp-text-on-dark)] sm:pt-[72px]">
      <div className="pointer-events-none absolute inset-0 lp-hero-grain" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 70% 40%, rgba(124,92,255,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(201,162,39,0.1) 0%, transparent 50%),
            linear-gradient(180deg, #08080a 0%, #0c0c10 100%)`,
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 sm:px-5 sm:py-14 lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-8 lg:px-8 lg:py-20 xl:py-24">
        <div className="flex flex-col text-center lg:text-left">
          <p className="lp-hero-animate lp-eyebrow mb-5 self-center lg:self-start">
            {t('hero.eyebrow')}
          </p>

          <h1 className="lp-hero-animate lp-hero-animate--delay-1 lp-serif text-[2.5rem] leading-[1.08] text-white sm:text-[2.85rem] md:text-[3.35rem] lg:text-[4.5rem] xl:text-[5rem]">
            {t('hero.titleLine1')}
            <br />
            {t('hero.titleLine2')}
            <br />
            <span className="lp-gold-text italic">{t('hero.titleHighlight')}</span>
          </h1>

          <p className="lp-hero-animate lp-hero-animate--delay-2 mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--lp-text-dim)] sm:text-lg lg:mx-0">
            {t('hero.subtitle')}
          </p>

          <div className="lp-hero-animate lp-hero-animate--delay-3 mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4 lg:justify-start">
            <Link
              to="/register"
              className="lp-btn-primary inline-flex rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5"
            >
              {t('hero.ctaPrimary')}
            </Link>
            <a
              href="#solutions"
              className="lp-btn-outline inline-flex rounded-full px-6 py-3 text-sm sm:px-7 sm:py-3.5"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>

          <ul className="lp-hero-animate lp-hero-animate--delay-4 mt-8 flex flex-col items-center gap-3 text-sm text-white/45 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 lg:items-start lg:justify-start">
            {trustKeys.map((key, i) => {
              const Icon = trustIcons[i];
              return (
                <li key={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-[var(--lp-gold)]/80" strokeWidth={1.5} />
                  {t(`hero.trust.${key}`)}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lp-hero-animate-scale flex w-full flex-col items-center lg:items-end lg:justify-center">
          <Suspense fallback={<HeroVisualFallback />}>
            <PremiumHeroVisual />
          </Suspense>
          <p className="lp-hero-caption mt-5 text-center lg:mt-6 lg:text-right">
            {t('hero.caption')}
          </p>
        </div>
      </div>
    </section>
  );
}
