import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { PremiumPlatformHeroBackground } from './PremiumPlatformHeroBackground';

const CHECK_KEYS = ['physical', 'digital', 'service', 'courses', 'artist'] as const;

const DEFAULT_TEXT = '#0f0f12';

export function PremiumPlatformHero() {
  const { t } = useLandingPremiumT();
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);
  const { customizationData } = usePlatformCustomizationContext();

  const backgroundUrl = customizationData?.media?.images?.landingPlatformHero as string | undefined;
  const backgroundAlt = t('platformHero.backgroundAlt');

  const customBackgroundColor = getPageCustomizationValue(
    pageCustomization,
    'platformHero.backgroundColor'
  );
  const hasBackgroundColor = Boolean(customBackgroundColor);
  const backgroundColor = hasBackgroundColor ? customBackgroundColor! : 'transparent';
  const textColor =
    getPageCustomizationValue(pageCustomization, 'platformHero.textColor') ?? DEFAULT_TEXT;

  return (
    <section
      className={`lp-platform-hero relative w-full overflow-hidden border-b border-black/8 pt-16 sm:pt-[72px]${hasBackgroundColor ? '' : ' lp-platform-hero--no-bg-color'}${backgroundUrl ? ' lp-platform-hero--has-photo' : ''}`}
      aria-label={t('platformHero.ariaLabel')}
      style={
        {
          '--lp-platform-hero-bg': backgroundColor,
          '--lp-platform-hero-text': textColor,
        } as CSSProperties
      }
    >
      {backgroundUrl ? (
        <>
          <PremiumPlatformHeroBackground src={backgroundUrl} alt={backgroundAlt} />
          <div
            className="lp-platform-hero__photo-overlay pointer-events-none absolute inset-0"
            aria-hidden
          />
        </>
      ) : null}
      <div className="lp-platform-hero__grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="lp-platform-hero__frame relative mx-auto flex w-full max-w-[100rem] flex-col px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-20">
        <div className="lp-platform-hero__content text-center lg:text-left">
          <h1 className="lp-platform-hero__title lp-serif text-[2.25rem] leading-[1.1] sm:text-[2.85rem] md:text-[3.35rem] lg:text-[4.25rem] xl:text-[4.75rem]">
            {t('platformHero.title')}
          </h1>

          <ul className="lp-platform-hero__checks mt-8 sm:mt-10 lg:mt-12">
            {CHECK_KEYS.map(key => (
              <li
                key={key}
                className="lp-platform-hero__check-item flex items-center gap-3 text-sm font-medium sm:text-base"
              >
                <span className="lp-platform-hero__check-icon flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.75} aria-hidden />
                </span>
                <span>{t(`platformHero.checks.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-platform-hero__cta mt-auto flex justify-center pb-6 pt-10 sm:pb-8 sm:pt-12 lg:justify-start lg:pb-10 lg:pt-14">
          <StoreCreateCtaLink className="lp-btn-primary inline-flex rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5">
            {t('nav.getStarted')}
          </StoreCreateCtaLink>
        </div>
      </div>
    </section>
  );
}
