import { describe, expect, it } from 'vitest';
import { isReservedStoreSlug, RESERVED_STORE_SLUGS } from '@/lib/store/reserved-store-slugs';
import { isSubdomainReserved } from '@/lib/subdomain-detector';

describe('reserved-store-slugs', () => {
  it('blocks sensitive and platform names', () => {
    for (const slug of [
      'api',
      'app',
      'web',
      'whatsapp',
      'police',
      'help',
      'admin',
      'emarzona',
      'geniuspay',
      'facebook',
      'paypal',
    ]) {
      expect(isReservedStoreSlug(slug), slug).toBe(true);
      expect(isSubdomainReserved(slug), slug).toBe(true);
    }
  });

  it('is case-insensitive and trims', () => {
    expect(isReservedStoreSlug('  API ')).toBe(true);
    expect(isReservedStoreSlug('WhatsApp')).toBe(true);
    expect(isReservedStoreSlug('POLICE')).toBe(true);
  });

  it('allows normal boutique slugs', () => {
    for (const slug of ['digitallog', 'ma-boutique', 'boutdig', 'atelier-soleil']) {
      expect(isReservedStoreSlug(slug), slug).toBe(false);
    }
  });

  it('exposes a non-empty shared list', () => {
    expect(RESERVED_STORE_SLUGS.length).toBeGreaterThan(50);
    expect(new Set(RESERVED_STORE_SLUGS).size).toBe(RESERVED_STORE_SLUGS.length);
  });
});
