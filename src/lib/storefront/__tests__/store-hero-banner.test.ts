import { describe, expect, it } from 'vitest';
import {
  resolveStoreHeroBannerHeightPx,
  STORE_HERO_BANNER_SPECS,
} from '@/lib/storefront/store-hero-banner';

describe('store-hero-banner', () => {
  it('respects min height on very narrow mobile', () => {
    expect(resolveStoreHeroBannerHeightPx(320)).toBe(STORE_HERO_BANNER_SPECS.base.minPx);
  });

  it('uses aspect ratio on typical mobile width', () => {
    expect(resolveStoreHeroBannerHeightPx(390)).toBe(Math.round(390 / 2.15));
  });

  it('caps height on large desktop', () => {
    expect(resolveStoreHeroBannerHeightPx(1920)).toBe(STORE_HERO_BANNER_SPECS.xl.maxPx);
  });

  it('scales at tablet breakpoint', () => {
    expect(resolveStoreHeroBannerHeightPx(768)).toBe(Math.round(768 / 2.85));
  });
});
