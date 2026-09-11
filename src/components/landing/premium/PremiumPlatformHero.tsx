import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Briefcase, Download, GraduationCap, Package, Palette } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { PremiumPlatformHeroVisual } from './platform-hero/PremiumPlatformHeroVisual';

const CHECK_ITEMS: {
  key: 'physical' | 'digital' | 'service' | 'courses' | 'artist';
  icon: LucideIcon;
}[] = [
  { key: 'physical', icon: Package },
  { key: 'digital', icon: Download },
  { key: 'service', icon: Briefcase },
  { key: 'courses', icon: GraduationCap },
  { key: 'artist', icon: Palette },
];

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
      className="lp-platform-hero lp-platform-hero--premium relative w-full overflow-hidden border-b border-white/[0.06] pt-16 sm:pt-[72px] bg-[#08080a] min-h-[92svh] lg:min-h-[100svh]"
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
      {/* Calques visuels plein hero (fond bleu + photo) */}
      <div className="lp-platform-hero__visual-layer pointer-events-none absolute inset-0 z-[1]">
        <PremiumPlatformHeroVisual
          backgroundUrl={backgroundUrl}
          backgroundAlt={backgroundAlt}
          leftBackgroundUrl={leftBackgroundUrl}
          leftBackgroundAlt={leftBackgroundAlt}
          ctaLabel={ctaLabel}
        />
      </div>

      <div className="lp-platform-hero__frame relative z-[2] mx-auto flex w-full max-w-[100rem] flex-col px-4 sm:px-6 md:px-10 lg:px-8 xl:px-12 2xl:px-14">
        <div className="lp-platform-hero__col-content relative z-[3] mx-auto flex w-full max-w-xl flex-col lg:mx-0 lg:max-w-2xl xl:max-w-2xl">
          <div className="lp-platform-hero__content text-center lg:text-left">
            <h1 className="lp-platform-hero__title lp-serif lp-hero-enter text-[1.75rem] leading-[1.08] sm:text-[2.65rem] md:text-[3rem] lg:text-[3.75rem] xl:text-[4.35rem]">
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine1')}</span>
              <span className="lp-platform-hero__title-line">{t('platformHero.titleLine2')}</span>
            </h1>

            {subtitle.trim() ? (
              <p className="lp-platform-hero__subtitle lp-hero-enter lp-hero-enter--d1 mx-auto mt-3 max-w-xl text-[15px] leading-relaxed sm:mt-5 sm:text-base lg:mx-0 lg:max-w-lg lg:text-lg">
                {subtitle}
              </p>
            ) : null}

            <ul className="lp-platform-hero__checks lp-hero-enter lp-hero-enter--d2 mx-auto mt-5 hidden w-fit max-w-full flex-col items-start sm:mt-8 lg:mx-0 lg:mt-12 lg:flex">
              {CHECK_ITEMS.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="lp-platform-hero__check-item flex min-w-0 items-center gap-3 text-sm font-medium sm:text-[15px] lg:gap-3.5 lg:text-lg xl:text-xl"
                >
                  <span className="lp-platform-hero__check-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                    <Icon
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[1.125rem] lg:w-[1.125rem]"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0">{t(`platformHero.checks.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
