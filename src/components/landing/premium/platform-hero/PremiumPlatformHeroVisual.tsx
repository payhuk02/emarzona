import { PremiumPlatformHeroBackground } from '../PremiumPlatformHeroBackground';
import { PremiumPlatformHeroEcosystem } from './PremiumPlatformHeroEcosystem';

interface PremiumPlatformHeroVisualProps {
  backgroundUrl?: string;
  backgroundAlt: string;
}

export function PremiumPlatformHeroVisual({
  backgroundUrl,
  backgroundAlt,
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
      <PremiumPlatformHeroEcosystem />
    </div>
  );
}
