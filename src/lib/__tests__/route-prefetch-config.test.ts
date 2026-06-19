import { describe, it, expect } from 'vitest';
import { getRoutePrefetchConfig, getVendorIdleRoutes } from '@/lib/route-prefetch-config';

describe('getRoutePrefetchConfig', () => {
  it('désactive le prefetch pendant le chargement auth/store', () => {
    expect(getRoutePrefetchConfig(true, false, null, 0).enabled).toBe(false);
    expect(getRoutePrefetchConfig(false, true, 'u1', 1).enabled).toBe(false);
  });

  it('prefetch public pour les anonymes', () => {
    const cfg = getRoutePrefetchConfig(false, false, null, 0);
    expect(cfg.enabled).toBe(true);
    expect(cfg.idleRoutes).toContain('/marketplace');
    expect(cfg.idleRoutes).not.toContain('/dashboard');
  });

  it('prefetch vendeur aligné sur liste verticale (pas /dashboard/products générique)', () => {
    const cfg = getRoutePrefetchConfig(false, false, 'u1', 2, 'digital');
    expect(cfg.idleRoutes).toContain('/dashboard/digital-products');
    expect(cfg.idleRoutes).not.toContain('/dashboard/products');
    expect(cfg.idleRoutes).not.toContain('/dashboard/analytics');
  });

  it('prefetch routes wizard selon commerce_type digital', () => {
    const cfg = getRoutePrefetchConfig(false, false, 'u1', 1, 'digital');
    expect(cfg.idleRoutes).toContain('/dashboard/products/new/digital');
    expect(cfg.idleRoutes).toContain('/dashboard/digital-products');
  });

  it('prefetch routes wizard selon commerce_type artiste', () => {
    const cfg = getRoutePrefetchConfig(false, false, 'u1', 1, 'artist');
    expect(cfg.idleRoutes).toContain('/dashboard/artist-products');
    expect(cfg.idleRoutes).toContain('/dashboard/products/new/artist');
  });

  it('prefetch routes wizard selon commerce_type physique', () => {
    const cfg = getRoutePrefetchConfig(false, false, 'u1', 1, 'physical');
    expect(cfg.idleRoutes).toContain('/dashboard/products/new/physical');
    expect(cfg.idleRoutes).toContain('/dashboard/physical-products');
  });

  it('getVendorIdleRoutes inclut physical-products pour physical', () => {
    expect(getVendorIdleRoutes('physical')).toContain('/dashboard/physical-products');
  });

  it('prefetch client connecté sans boutique', () => {
    const cfg = getRoutePrefetchConfig(false, false, 'u1', 0);
    expect(cfg.idleRoutes).toContain('/account');
    expect(cfg.idleRoutes).toContain('/cart');
  });
});
