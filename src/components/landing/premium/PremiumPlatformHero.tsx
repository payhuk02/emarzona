import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { PremiumPlatformHeroBackground } from './PremiumPlatformHeroBackground';
import { PremiumPlatformHeroAmbient } from './platform-hero/PremiumPlatformHeroAmbient';
import { PremiumPlatformHeroVisual } from './platform-hero/PremiumPlatformHeroVisual';

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

  const customBackgroundColor = getPageCustomizationValue(
    pageCustomization,
    'platformHero.backgroundColor'
  );
  const hasBackgroundColor = Boolean(customBackgroundColor);
  const backgroundColor = hasBackgroundColor ? customBackgroundColor! : undefined;
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
      className={`lp-platform-hero lp-platform-hero--premium relative w-full overflow-hidden border-b border-white/[0.06] pt-16 sm:pt-[72px]${hasBackgroundColor ? '' : ' lp-platform-hero--no-bg-color'}${backgroundUrl ? ' lp-platform-hero--has-photo' : ''}${leftBackgroundUrl ? ' lp-platform-hero--has-left-photo' : ''}`}
      aria-label={t('platformHero.ariaLabel')}
      style={
        {
          ...(backgroundColor ? { '--lp-platform-hero-bg': backgroundColor } : {}),
          '--lp-platform-hero-text': textColor,
          '--lp-platform-hero-cta-bg': ctaBackgroundColor,
          '--lp-platform-hero-cta-text': ctaTextColor,
        } as CSSProperties
      }
    >
      <PremiumPlatformHeroAmbient />
      <div className="lp-platform-hero__grain pointer-events-none absolute inset-0" aria-hidden />

      {leftBackgroundUrl ? (
        <div className="lp-platform-hero__left-bg pointer-events-none absolute inset-y-0 left-0 z-[1]">
          <PremiumPlatformHeroBackground
            src={leftBackgroundUrl}
            alt={leftBackgroundAlt}
            variant="left"
          />
          <div className="lp-platform-hero__left-bg-overlay absolute inset-0" aria-hidden />
        </div>
      ) : null}

      <div className="lp-platform-hero__frame relative z-[2] mx-auto grid w-full max-w-[100rem] grid-cols-1 gap-8 px-4 sm:px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 lg:px-14 xl:px-16 2xl:px-20">
        <div className="lp-platform-hero__col-content flex flex-col">
          <div className="lp-platform-hero__content text-center lg:text-left">
            <h1 className="lp-platform-hero__title lp-serif text-[2rem] leading-[1.08] sm:text-[2.65rem] md:text-[3rem] lg:text-[3.65rem] xl:text-[4.15rem]">
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine1')}</span>
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine2')}</span>
            </h1>

            {subtitle.trim() ? (
              <p className="lp-platform-hero__subtitle mx-auto mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base lg:mx-0 lg:max-w-lg">
                {subtitle}
              </p>
            ) : null}

            <ul className="lp-platform-hero__checks mt-8 sm:mt-10">
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

          <div className="lp-platform-hero__cta relative z-10 mt-auto hidden justify-center pb-6 pt-10 sm:pb-8 sm:pt-12 lg:flex lg:justify-start lg:pb-10 lg:pt-14">
            <StoreCreateCtaLink className="lp-platform-hero__cta-btn inline-flex rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5">
              {ctaLabel}
            </StoreCreateCtaLink>
          </div>
        </div>

        <PremiumPlatformHeroVisual
          backgroundUrl={backgroundUrl}
          backgroundAlt={backgroundAlt}
          ctaLabel={ctaLabel}
        />
      </div>
    </section>
  );
}
