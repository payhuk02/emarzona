import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  loadAllPlatformRoutePaths,
  countPlatformRoutes,
  auditVendorPrefetchAlignment,
  auditDocumentedLinksRegistered,
  auditPhysicalOnlyPaths,
  findCapabilityPrefixCollisions,
  LEGACY_ROUTE_DEBT,
  auditForbiddenDashboardAdminImports,
  auditPhysicalCanonicalFilesExist,
  auditRemovedAdminShims,
  auditSellerIntegrationsWrapperSource,
  auditIntegrationsCanonicalFilesExist,
  auditSellerPhysicalWrapperSources,
  SELLER_PHYSICAL_CANONICAL_FILES,
  SELLER_PHYSICAL_CANONICAL_PREFIX,
  SELLER_DASHBOARD_PAGE_MODULES,
  SELLER_PHYSICAL_PAGE_MODULES,
  SELLER_PREFIX_INCONSISTENCIES,
  runFullPlatformRouteAudit,
  auditRouteModuleMinimums,
  auditLegacyRoutesRedirectOnly,
  PLATFORM_ROUTE_MODULE_MIN_COUNTS,
  ROUTE_FILES,
  summarizePlatformRouteAudit,
} from '@/lib/routes/platform-routes-audit';
import {
  allSmokeMatrixStaticPaths,
  smokePathMatchesRegistered,
} from '@/lib/routes/platform-routes-smoke-matrix';
import { isPhysicalOnlySellerPath } from '@/lib/billing/store-commerce-access';

describe('platform-routes-audit', () => {
  const routes = loadAllPlatformRoutePaths();
  const dashboardPaths = routes['src/routes/dashboardRoutes.tsx'];

  it('inventorie au moins 250 routes plateforme', () => {
    const { total } = countPlatformRoutes(routes);
    expect(total).toBeGreaterThanOrEqual(250);
  });

  it('couvre les 5 modules de routing avec seuils minimum', () => {
    expect(Object.keys(routes)).toHaveLength(5);
    expect(ROUTE_FILES).toHaveLength(5);
    const { ok, gaps } = auditRouteModuleMinimums(routes);
    expect(gaps, JSON.stringify(gaps)).toEqual({});
    expect(ok).toBe(true);
    expect(routes['src/routes/customerRoutes.tsx'].length).toBeGreaterThanOrEqual(
      PLATFORM_ROUTE_MODULE_MIN_COUNTS['src/routes/customerRoutes.tsx']
    );
    expect(routes['src/routes/storeSubdomainRoutes.tsx'].length).toBeGreaterThanOrEqual(
      PLATFORM_ROUTE_MODULE_MIN_COUNTS['src/routes/storeSubdomainRoutes.tsx']
    );
  });

  it('aligne le prefetch vendeur sur la liste verticale (pas /dashboard/products)', () => {
    for (const type of ['digital', 'course', 'artist', 'service'] as const) {
      const { ok, listPath } = auditVendorPrefetchAlignment(type);
      expect(ok, `prefetch ${type}`).toBe(true);
      expect(listPath).not.toBe('/dashboard/products');
    }
    const physical = auditVendorPrefetchAlignment('physical');
    expect(physical.listPath).toBe('/dashboard/physical-products');
    expect(physical.idleRoutes).toContain('/dashboard/physical-products');
  });

  it('bloque physical-lots-old pour les boutiques non physiques (PHYSICAL_ONLY)', () => {
    expect(isPhysicalOnlySellerPath('/dashboard/physical-lots-old')).toBe(true);
    expect(isPhysicalOnlySellerPath('/dashboard/physical-lots')).toBe(true);
  });

  it('enregistre les liens documentés sans route 404', () => {
    const { missing } = auditDocumentedLinksRegistered(dashboardPaths);
    expect(missing).toEqual([]);
  });

  it('signale les routes legacy encore déclarées (audit debt)', () => {
    const allPaths = Object.values(routes).flat();
    for (const legacy of LEGACY_ROUTE_DEBT) {
      if (allPaths.includes(legacy.path)) {
        expect(legacy.replacement).toBeTruthy();
      }
    }
  });

  it('détecte les collisions capability sur routes physiques pour digital', () => {
    const collisions = findCapabilityPrefixCollisions(dashboardPaths, 'digital');
    expect(collisions).toContain('/dashboard/physical-products');
    expect(collisions).not.toContain('/dashboard/digital-products');
  });

  it('expose un résumé audit structuré', () => {
    const summary = summarizePlatformRouteAudit();
    expect(summary.counts.total).toBeGreaterThan(250);
    expect(summary.verticalListPaths.artist).toBe('/dashboard/artist-products');
    expect(summary.legacyDebt.length).toBeGreaterThan(0);
  });

  it('flag les chemins physical hors PHYSICAL_ONLY_SELLER_PATHS (régression)', () => {
    const gaps = auditPhysicalOnlyPaths(dashboardPaths);
    expect(gaps).not.toContain('/dashboard/physical-lots-old');
  });

  it('expose les routes canoniques cours sous /dashboard/courses', () => {
    expect(dashboardPaths).toContain('/dashboard/courses/:courseId/gamification');
    expect(dashboardPaths).toContain('/dashboard/courses/:slug/analytics');
  });

  it('redirige les préfixes vendeur legacy (pas de double page)', () => {
    const dashboardSource = readFileSync(
      join(import.meta.dirname, '../../../routes/dashboardRoutes.tsx'),
      'utf8'
    );
    for (const item of SELLER_PREFIX_INCONSISTENCIES) {
      expect(item.status, item.path).toBe('redirect');
      expect(dashboardSource).toContain(`path="${item.path}"`);
      expect(dashboardSource).toMatch(/Navigate|SellerLegacyPathRedirect/);
    }
  });

  it('redirige advanced-orders-test vers advanced-orders', () => {
    const dashboardSource = readFileSync(
      join(import.meta.dirname, '../../../routes/dashboardRoutes.tsx'),
      'utf8'
    );
    expect(dashboardSource).toContain('path="/dashboard/advanced-orders-test"');
    expect(dashboardSource).toContain('to="/dashboard/advanced-orders"');
  });

  it('monte les modules seller extraits (pas Admin* direct)', () => {
    const dashboardSource = readFileSync(
      join(import.meta.dirname, '../../../routes/dashboardRoutes.tsx'),
      'utf8'
    );
    for (const mod of [...SELLER_DASHBOARD_PAGE_MODULES, ...SELLER_PHYSICAL_PAGE_MODULES]) {
      expect(dashboardSource).toContain(mod);
    }
    expect(dashboardSource).not.toMatch(/pr\('\/dashboard\/loyalty',\s*AdminLoyaltyManagement\)/);
    expect(auditForbiddenDashboardAdminImports(dashboardSource)).toEqual([]);
  });

  it('migre les modules physiques vers pages/dashboard/physical (P4)', () => {
    expect(auditPhysicalCanonicalFilesExist()).toEqual([]);
    const { ok, violations } = auditSellerPhysicalWrapperSources();
    expect(violations, violations.join('; ')).toEqual([]);
    expect(ok).toBe(true);
    expect(SELLER_PHYSICAL_CANONICAL_FILES.length).toBeGreaterThanOrEqual(9);
  });

  it('migre IntegrationsPage et supprime les shims admin (P5)', () => {
    expect(auditIntegrationsCanonicalFilesExist()).toEqual([]);
    expect(auditRemovedAdminShims()).toEqual([]);
    const { ok, violations } = auditSellerIntegrationsWrapperSource();
    expect(violations, violations.join('; ')).toEqual([]);
    expect(ok).toBe(true);
  });

  it('redirige les routes legacy déclarées (sauf alias documentés)', () => {
    const { ok, violations } = auditLegacyRoutesRedirectOnly();
    expect(violations, violations.join('; ')).toEqual([]);
    expect(ok).toBe(true);
  });

  it('passe l’audit complet plateforme sans régression', () => {
    const result = runFullPlatformRouteAudit();
    expect(result.failures, result.failures.join('\n')).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.totalRoutes).toBeGreaterThanOrEqual(280);
    expect(Object.keys(result.byModule)).toHaveLength(5);
  });

  it('enregistre tous les chemins de la smoke matrix Playwright', () => {
    const registered = Object.values(routes).flat();
    const missing = allSmokeMatrixStaticPaths().filter(
      p => !smokePathMatchesRegistered(p, registered)
    );
    expect(missing, missing.join(', ')).toEqual([]);
  });
});
