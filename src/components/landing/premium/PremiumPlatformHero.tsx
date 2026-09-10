import type { CSSProperties } from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { PremiumPlatformHeroBackground } from './PremiumPlatformHeroBackground';
import { PremiumPlatformHeroVisual } from './platform-hero/PremiumPlatformHeroVisual';

const PremiumHero3DScene = lazy(() =>
  import('./PremiumHero3DScene').then(m => ({ default: m.PremiumHero3DScene }))
);

/** Monte la scène 3D uniquement après interaction utilisateur (pas d'auto-arm idle). */
function DeferredHero3D() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('keydown', enable, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <PremiumHero3DScene />
    </Suspense>
  );
}

const CHECK_KEYS = ['physical', 'digital', 'service', 'courses', 'artist'] as const;

const DEFAULT_TEXT = '#f4f3f0';
const DEFAULT_CTA_BG = '#f97316';
const DEFAULT_CTA_TEXT = '#ffffff';

export function PremiumPlatformHero() {
  const { t } = useLandingPremiumT();
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);
  const { customizationData } = usePlatformCustomizationContext();

  const backgroundUrl = customizationData?.media?.images?.landingPlatformHero as string | undefined;
  const leftBackgroundUrl = customizationData?.media?.images?.landingPlatformHeroLeft as
    | string
    | undefined;
  const backgroundAlt = t('platformHero.backgroundAlt');
  const leftBackgroundAlt =
    getPageCustomizationValue(pageCustomization, 'platformHero.leftBackgroundAlt') ??
    t('platformHero.leftBackgroundAlt');

  const textColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.textColor') ?? DEFAULT_TEXT;
  const ctaBackgroundColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.ctaBackgroundColor') ??
    DEFAULT_CTA_BG;
  const ctaTextColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.ctaTextColor') ?? DEFAULT_CTA_TEXT;

  const subtitle = t('platformHero.subtitle');
  const ctaLabel =
    getPageCustomizationValue(pageCustomization, 'platformHero.ctaLabel') ??
    t('platformHero.ctaLabel');

  return (
    <section
      className="lp-platform-hero lp-platform-hero--premium relative w-full overflow-hidden border-b border-white/[0.06] pt-16 sm:pt-[72px] bg-[#08080a]"
      aria-label={t('platformHero.ariaLabel')}
      style={
        {
          '--lp-platform-hero-text': textColor,
          '--lp-platform-hero-cta-bg': ctaBackgroundColor,
          '--lp-platform-hero-cta-text': ctaTextColor,
          backgroundColor: '#08080a',
        } as CSSProperties
      }
    >
      <DeferredHero3D />

      {leftBackgroundUrl ? (
        <div className="lp-platform-hero__left-bg pointer-events-none absolute inset-y-0 left-0 z-[1]">
          <PremiumPlatformHeroBackground
            src={leftBackgroundUrl}
            alt={leftBackgroundAlt}
            variant="left"
          />
        </div>
      ) : null}

      <div className="lp-platform-hero__frame relative z-[2] mx-auto grid w-full max-w-[100rem] grid-cols-1 gap-8 px-4 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,1.72fr)] lg:gap-0 xl:grid-cols-[minmax(0,0.32fr)_minmax(0,1.78fr)] lg:px-8 xl:px-12 2xl:px-14">
        <div className="lp-platform-hero__col-content flex flex-col">
          <div className="lp-platform-hero__content text-center lg:text-left">
            <h1 className="lp-platform-hero__title lp-serif lp-hero-enter text-[2rem] leading-[1.08] sm:text-[2.65rem] md:text-[3rem] lg:text-[3.65rem] xl:text-[4.15rem]">
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine1')}</span>
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine2')}</span>
            </h1>

            {subtitle.trim() ? (
              <p className="lp-platform-hero__subtitle lp-hero-enter lp-hero-enter--d1 mx-auto mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base lg:mx-0 lg:max-w-lg">
                {subtitle}
              </p>
            ) : null}

            <ul className="lp-platform-hero__checks lp-hero-enter lp-hero-enter--d2 mt-8 sm:mt-10">
              {CHECK_KEYS.map(key => (
                <li
                  key={key}
                  className="lp-platform-hero__check-item flex min-w-0 items-center gap-3 text-sm font-medium sm:text-[15px]"
                >
                  <span className="lp-platform-hero__check-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.75} aria-hidden />
                  </span>
                  <span className="min-w-0">{t(`platformHero.checks.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lp-hero-enter lp-hero-enter--d3">
          <PremiumPlatformHeroVisual
            backgroundUrl={backgroundUrl}
            backgroundAlt={backgroundAlt}
            ctaLabel={ctaLabel}
          />
        </div>
      </div>
    </section>
  );
}
