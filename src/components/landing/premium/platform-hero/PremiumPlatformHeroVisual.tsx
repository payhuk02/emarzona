import { PremiumPlatformHeroBackground } from '../PremiumPlatformHeroBackground';

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
      {/* Fond bleu : couvre tout le hero (y compris sous la nav) */}
      {leftBackgroundUrl ? (
        <div className="lp-platform-hero__left-bg pointer-events-none absolute inset-0 z-0">
          <PremiumPlatformHeroBackground
            src={leftBackgroundUrl}
            alt={leftBackgroundAlt}
            variant="left"
          />
        </div>
      ) : null}

      {/* Photo femme : zone sous la nav, entière via object-contain */}
      {backgroundUrl ? (
        <div className="lp-platform-hero__photo-layer pointer-events-none absolute inset-x-0 bottom-0 z-[1] top-[var(--lp-nav-offset,4.25rem)]">
          <PremiumPlatformHeroBackground src={backgroundUrl} alt={backgroundAlt} />
        </div>
      ) : (
        <div
          className="lp-platform-hero__visual-fallback pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        />
      )}
    </div>
  );
}
