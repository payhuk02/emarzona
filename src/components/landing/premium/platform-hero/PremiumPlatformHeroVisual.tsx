import { PremiumPlatformHeroBackground } from '../PremiumPlatformHeroBackground';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { PremiumPlatformHeroEcosystem } from './PremiumPlatformHeroEcosystem';

interface PremiumPlatformHeroVisualProps {
  backgroundUrl?: string;
  backgroundAlt: string;
  ctaLabel: string;
}

export function PremiumPlatformHeroVisual({
  backgroundUrl,
  backgroundAlt,
  ctaLabel,
}: PremiumPlatformHeroVisualProps) {
  return (
    <div className="lp-platform-hero__visual relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-0 lg:h-full">
      {backgroundUrl ? (
        <>
          <PremiumPlatformHeroBackground src={backgroundUrl} alt={backgroundAlt} />
          <div
            className="lp-platform-hero__photo-overlay pointer-events-none absolute inset-0"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="lp-platform-hero__visual-fallback pointer-events-none absolute inset-0"
          aria-hidden
        />
      )}
      <div className="lp-platform-hero__cta lp-platform-hero__cta--visual lg:hidden">
        <StoreCreateCtaLink className="lp-platform-hero__cta-btn inline-flex rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5">
          {ctaLabel}
        </StoreCreateCtaLink>
      </div>
      <PremiumPlatformHeroEcosystem />
    </div>
  );
}
