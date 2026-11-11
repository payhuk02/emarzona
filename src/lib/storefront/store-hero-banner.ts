/**
 * Spécifications bannière hero boutique (StoreHeader).
 * Hauteur effective = min(max(largeur ÷ ratio, minHeight), maxHeight).
 * 1rem = 16px (Tailwind par défaut).
 *
 * Ratios proches des bannières marketing paysage (~2.5:1 → 3:1) pour
 * que object-cover remplisse le cadre sans letterbox mobile excessif.
 */
export const STORE_HERO_BANNER_SPECS = {
  /** < 640px — ~2.5:1 */
  base: { aspectRatio: 2.5, minPx: 140, maxPx: 200 },
  /** ≥ 640px */
  sm: { aspectRatio: 2.6, minPx: 160, maxPx: 240 },
  /** ≥ 768px */
  md: { aspectRatio: 2.75, minPx: 180, maxPx: 320 },
  /** ≥ 1024px */
  lg: { aspectRatio: 2.9, maxPx: 400 },
  /** ≥ 1280px */
  xl: { aspectRatio: 3, maxPx: 480 },
} as const;

/** Classes Tailwind appliquées au conteneur bannière. */
export const STORE_HERO_BANNER_CLASS =
  'aspect-[5/2] min-h-[8.75rem] max-h-[12.5rem] ' +
  'sm:aspect-[13/5] sm:min-h-[10rem] sm:max-h-[15rem] ' +
  'md:aspect-[11/4] md:min-h-[11.25rem] md:max-h-[20rem] ' +
  'lg:aspect-[29/10] lg:max-h-[25rem] ' +
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
