/**
 * Formats pixels exacts des images Media (landing + Auth + heroes marketing).
 * Basés sur les assets par défaut et les dimensions déclarées dans le code.
 */

export type MediaPixelFormat = {
  width: number;
  height: number;
  /** Ratio lisible, ex. « 4:3 » */
  ratio?: string;
};

export function formatMediaPixelSize(format: MediaPixelFormat): string {
  const base = `${format.width} × ${format.height} px`;
  return format.ratio ? `${base} (${format.ratio})` : base;
}

/** Auth — width/height déclarés dans AuthHeroPanel (portrait 4:5). */
export const AUTH_HERO_FORMAT: MediaPixelFormat = {
  width: 1024,
  height: 1280,
  ratio: '4:5',
};

/**
 * Hero plateforme — pas d’asset bundlé ; tailles cibles alignées sur
 * IMAGE_PRESETS.platformHero* (large 1920) et usage CSS (cover / contain).
 */
export const PLATFORM_HERO_LEFT_FORMAT: MediaPixelFormat = {
  width: 1920,
  height: 1080,
  ratio: '16:9',
};

export const PLATFORM_HERO_VISUAL_FORMAT: MediaPixelFormat = {
  width: 1200,
  height: 1600,
  ratio: '3:4',
};

/** Adapt — adapt-entrepreneur.webp */
export const LANDING_ADAPT_FORMAT: MediaPixelFormat = {
  width: 1024,
  height: 686,
  ratio: '≈3:2',
};

/** CTA final — cta-visual-premium.png (carré). */
export const LANDING_CTA_FORMAT: MediaPixelFormat = {
  width: 1024,
  height: 1024,
  ratio: '1:1',
};

/** Sell-ways — assets 1600×1200 (4:3) ; code width/height 1600×1200. */
export const LANDING_SELL_WAY_FORMAT: MediaPixelFormat = {
  width: 1600,
  height: 1200,
  ratio: '4:3',
};

/** Carrousel PremiumHero — hero-carousel-*.webp + SLIDE_WIDTH/HEIGHT. */
export const LANDING_CAROUSEL_FORMAT: MediaPixelFormat = {
  width: 640,
  height: 351,
  ratio: '≈16:9',
};

/** Pages Solutions / Fonctionnalités — marketing-heroes/*.png */
export const MARKETING_HERO_FORMAT: MediaPixelFormat = {
  width: 1536,
  height: 1024,
  ratio: '3:2',
};
