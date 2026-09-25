import { useEffect, useState } from 'react';
import { PremiumPlatformHeroBackground } from '../PremiumPlatformHeroBackground';

interface PremiumPlatformHeroVisualProps {
  backgroundUrl?: string;
  backgroundAlt: string;
  leftBackgroundUrl?: string;
  leftBackgroundAlt?: string;
  ctaLabel: string;
}

/** Monte le fond décoratif après idle pour ne pas concurrencer le LCP portrait. */
function DeferredAtmosphereBackground({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setReady(true), { timeout: 2200 });
      return () => win.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return <PremiumPlatformHeroBackground src={src} alt={alt} variant="left" />;
}

export function PremiumPlatformHeroVisual({
  backgroundUrl,
  backgroundAlt,
  leftBackgroundUrl,
  leftBackgroundAlt = '',
  ctaLabel: _ctaLabel,
}: PremiumPlatformHeroVisualProps) {
  const hasPortrait = Boolean(backgroundUrl);
  // Sans portrait LCP : le fond e-commerçants devient l’image LCP (eager).
  const atmosphereEager = !hasPortrait && Boolean(leftBackgroundUrl);

  return (
    <div className="lp-platform-hero__visual absolute inset-0 h-full w-full">
      {leftBackgroundUrl ? (
        <div className="lp-platform-hero__left-bg pointer-events-none absolute inset-0 z-0">
          {atmosphereEager ? (
            <PremiumPlatformHeroBackground
              src={leftBackgroundUrl}
              alt={leftBackgroundAlt}
              variant="left"
            />
          ) : (
            <DeferredAtmosphereBackground src={leftBackgroundUrl} alt={leftBackgroundAlt} />
          )}
        </div>
      ) : null}

      {/* Ombre professionnelle : lisibilité texte + profondeur cinématographique */}
      <div
        className="lp-platform-hero__shadow pointer-events-none absolute inset-0 z-[2]"
        aria-hidden
      />

      {backgroundUrl ? (
        <div className="lp-platform-hero__photo-layer pointer-events-none absolute inset-x-0 bottom-0 z-[3] top-[var(--lp-nav-offset,4.25rem)]">
          <PremiumPlatformHeroBackground src={backgroundUrl} alt={backgroundAlt} />
        </div>
      ) : !leftBackgroundUrl ? (
        <div
          className="lp-platform-hero__visual-fallback pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
