import { describe, it, expect } from 'vitest';
import {
  buildMetaCacheKey,
  buildBotRateLimitKey,
  isLikelyCustomStoreHost,
  isPlatformHost,
  parseCachedMeta,
  serializeCachedMeta,
} from '../meta-cache';

describe('meta-cache (Epic 4.1)', () => {
  it('buildMetaCacheKey ignore utm params', () => {
    const key = buildMetaCacheKey(
      'https://www.emarzona.com/marketplace?q=phone&utm_source=fb&gclid=abc'
    );
    expect(key).toBe('seo:meta:v1:www.emarzona.com/marketplace?q=phone');
  });

  it('buildMetaCacheKey conserve params SEO utiles', () => {
    const key = buildMetaCacheKey('https://shop.example.com/products/foo?variant=2');
    expect(key).toContain('shop.example.com/products/foo?variant=2');
  });

  it('parseCachedMeta expire apres TTL', () => {
    const raw = serializeCachedMeta({
      meta: {
        title: 'T',
        description: 'D',
        image: 'https://x/img.png',
        url: 'https://x',
        type: 'website',
      },
      cachedAt: Date.now() - 11 * 60 * 1000,
    });
    expect(parseCachedMeta(raw)).toBeNull();
  });

  it('isLikelyCustomStoreHost detecte domaine vendeur', () => {
    expect(isLikelyCustomStoreHost('boutique.client.com')).toBe(true);
    expect(isLikelyCustomStoreHost('www.emarzona.com')).toBe(false);
    expect(isLikelyCustomStoreHost('store.myemarzona.shop')).toBe(false);
  });

  it('buildBotRateLimitKey normalise IP', () => {
    expect(buildBotRateLimitKey(' 1.2.3.4 ')).toBe('seo:botrl:v1:1.2.3.4');
  });

  it('isPlatformHost inclut vercel preview', () => {
    expect(isPlatformHost('emarzona-git-main-payhuk.vercel.app')).toBe(true);
  });
});
