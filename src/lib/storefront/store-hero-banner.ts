/**
 * Spécifications bannière hero boutique (StoreHeader).
 * Hauteur effective = min(max(largeur ÷ ratio, minHeight), maxHeight).
 * 1rem = 16px (Tailwind par défaut).
 */
export const STORE_HERO_BANNER_SPECS = {
  /** < 640px — ratio 2.15:1, min 160px, max 224px */
  base: { aspectRatio: 2.15, minPx: 160, maxPx: 224 },
  /** ≥ 640px — ratio 2.45:1, min 176px, max 288px */
  sm: { aspectRatio: 2.45, minPx: 176, maxPx: 288 },
  /** ≥ 768px — ratio 2.85:1, min 192px, max 352px */
  md: { aspectRatio: 2.85, minPx: 192, maxPx: 352 },
  /** ≥ 1024px — ratio 3.1:1, max 416px */
  lg: { aspectRatio: 3.1, maxPx: 416 },
  /** ≥ 1280px — ratio 3.1:1, max 480px */
  xl: { aspectRatio: 3.1, maxPx: 480 },
} as const;

/** Classes Tailwind appliquées au conteneur bannière. */
export const STORE_HERO_BANNER_CLASS =
  'aspect-[2.15/1] min-h-[10rem] max-h-[14rem] ' +
  'sm:aspect-[2.45/1] sm:min-h-[11rem] sm:max-h-[18rem] ' +
  'md:aspect-[2.85/1] md:min-h-[12rem] md:max-h-[22rem] ' +
  'lg:aspect-[3.1/1] lg:max-h-[26rem] ' +
  'xl:max-h-[30rem]';

/** Hauteur effective (px) pour une largeur viewport donnée. */
export function resolveStoreHeroBannerHeightPx(viewportWidth: number): number {
  const spec =
    viewportWidth >= 1280
      ? STORE_HERO_BANNER_SPECS.xl
      : viewportWidth >= 1024
        ? STORE_HERO_BANNER_SPECS.lg
        : viewportWidth >= 768
          ? STORE_HERO_BANNER_SPECS.md
          : viewportWidth >= 640
            ? STORE_HERO_BANNER_SPECS.sm
            : STORE_HERO_BANNER_SPECS.base;

  const minPx = 'minPx' in spec ? spec.minPx : 0;
  const maxPx = spec.maxPx;
  const fromRatio = viewportWidth / spec.aspectRatio;
  return Math.round(Math.min(Math.max(fromRatio, minPx), maxPx));
}
