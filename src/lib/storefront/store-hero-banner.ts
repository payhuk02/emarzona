/**
 * Spécifications bannière hero boutique (StoreHeader).
 * Hauteur effective = min(max(largeur ÷ ratio, minHeight), maxHeight).
 * 1rem = 16px (Tailwind par défaut).
 *
 * Mobile/tablette : ratios plus larges (≈2:1 → 2.4:1) pour les bannières
 * marketing conçues en paysage — évite le letterbox excessif du 16:9
 * avec object-contain sur des visuels type 3:1.
 */
export const STORE_HERO_BANNER_SPECS = {
  /** < 640px — ~2:1, bannières paysage lisibles */
  base: { aspectRatio: 2, minPx: 160, maxPx: 220 },
  /** ≥ 640px */
  sm: { aspectRatio: 2.2, minPx: 180, maxPx: 280 },
  /** ≥ 768px */
  md: { aspectRatio: 2.4, minPx: 200, maxPx: 360 },
  /** ≥ 1024px */
  lg: { aspectRatio: 2.8, maxPx: 420 },
  /** ≥ 1280px */
  xl: { aspectRatio: 3, maxPx: 480 },
} as const;

/** Classes Tailwind appliquées au conteneur bannière. */
export const STORE_HERO_BANNER_CLASS =
  'aspect-[2/1] min-h-[10rem] max-h-[13.75rem] ' +
  'sm:aspect-[11/5] sm:min-h-[11.25rem] sm:max-h-[17.5rem] ' +
  'md:aspect-[12/5] md:min-h-[12.5rem] md:max-h-[22.5rem] ' +
  'lg:aspect-[14/5] lg:max-h-[26.25rem] ' +
  'xl:aspect-[3/1] xl:max-h-[30rem]';

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
