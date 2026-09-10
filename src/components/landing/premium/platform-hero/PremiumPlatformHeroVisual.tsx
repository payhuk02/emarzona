import { PremiumPlatformHeroBackground } from '../PremiumPlatformHeroBackground';
import { PremiumPlatformHeroEcosystem } from './PremiumPlatformHeroEcosystem';

interface PremiumPlatformHeroVisualProps {
  backgroundUrl?: string;
  backgroundAlt: string;
  leftBackgroundUrl?: string;
  leftBackgroundAlt?: string;
  ctaLabel: string;
}

export function PremiumPlatformHeroVisual({
  backgroundUrl,
  backgroundAlt,
  leftBackgroundUrl,
  leftBackgroundAlt = '',
  ctaLabel: _ctaLabel,
}: PremiumPlatformHeroVisualProps) {
  return (
    <div className="lp-platform-hero__visual absolute inset-0 h-full w-full">
      {leftBackgroundUrl ? (
        <div className="lp-platform-hero__left-bg pointer-events-none absolute inset-0 z-0">
          <PremiumPlatformHeroBackground
            src={leftBackgroundUrl}
            alt={leftBackgroundAlt}
            variant="left"
          />
        </div>
      ) : null}

      {backgroundUrl ? (
        <div className="lp-platform-hero__photo-layer pointer-events-none absolute inset-0 z-[1]">
          <PremiumPlatformHeroBackground src={backgroundUrl} alt={backgroundAlt} />
        </div>
      ) : (
        <div
          className="lp-platform-hero__visual-fallback pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        />
      )}

      <PremiumPlatformHeroEcosystem />
    </div>
  );
}
