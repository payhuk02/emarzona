/**
 * Audit statique des routes plateforme — performance, stabilité, cohérence.
 * Exécution : npx vitest run src/lib/routes/__tests__/platform-routes-audit.test.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import {
  VENDOR_PRODUCT_LIST_PATH_BY_TYPE,
  canAccessCommercePath,
  getRouteCapabilityRule,
  getVendorProductListPath,
} from '@/lib/commerce/store-capability-map';
import { isPhysicalOnlySellerPath } from '@/lib/billing/store-commerce-access';
import { getVendorIdleRoutes } from '@/lib/route-prefetch-config';

const REPO_ROOT = join(import.meta.dirname, '../../..');

const ROUTE_FILES = [
  'src/routes/publicRoutes.tsx',
  'src/routes/customerRoutes.tsx',
  'src/routes/dashboardRoutes.tsx',
  'src/routes/adminRoutes.tsx',
  'src/routes/storeSubdomainRoutes.tsx',
] as const;

export { ROUTE_FILES };

/** Liens documentés sans route dédiée (doivent rediriger ou être retirés). */
export const DOCUMENTED_VENDOR_LINKS: readonly string[] = ['/dashboard/smart-notifications'];

/** Routes legacy — à supprimer ou rediriger (audit debt). */
export const LEGACY_ROUTE_DEBT: readonly { path: string; replacement: string; reason: string }[] = [
  { path: '/cart-old', replacement: '/cart', reason: 'Panier legacy remplacé par CartEnhanced' },
  {
    path: '/dashboard/physical-lots-old',
    replacement: '/dashboard/physical-lots',
    reason: 'Alias admin lots → gestion dashboard unifiée',
  },
  {
    path: '/dashboard/advanced-orders-test',
    replacement: '/dashboard/advanced-orders',
    reason: 'Surface de test exposée en production',
  },
  { path: '/checkout/cart', replacement: '/checkout', reason: 'Redirect legacy checkout' },
  { path: '/cart/checkout', replacement: '/checkout', reason: 'Redirect legacy checkout' },
];

/** Pages seller extraites du namespace admin — programmes & logistique (P2). */
export const SELLER_DASHBOARD_PAGE_MODULES = [
  'SellerWebhookManagement',
  'SellerLoyaltyManagement',
  'SellerGiftCardManagement',
  'SellerWarehousesManagement',
  'SellerProductKitsManagement',
  'SellerCostOptimization',
  'SellerBatchShipping',
] as const;

/** Pages seller extraites — modules physiques & intégrations (P3). */
export const SELLER_PHYSICAL_PAGE_MODULES = [
  'SellerPhysicalInventoryManagement',
  'SellerPhysicalPromotions',
  'SellerPhysicalProductsAnalytics',
  'SellerPhysicalSerialTracking',
  'SellerPhysicalBarcodeScanner',
  'SellerPhysicalPreOrders',
  'SellerPhysicalBackorders',
  'SellerPhysicalBundles',
  'SellerPhysicalMultiCurrency',
  'SellerIntegrationsPage',
] as const;

/** Imports admin interdits dans dashboardRoutes (doivent passer par seller/*). */
export const FORBIDDEN_DASHBOARD_ADMIN_IMPORTS = [
  '@/pages/admin/Physical',
  '@/pages/admin/IntegrationsPage',
  '@/pages/admin/AdminLoyaltyManagement',
  '@/pages/admin/AdminGiftCardManagement',
  '@/pages/admin/AdminWarehousesManagement',
  '@/pages/admin/AdminProductKitsManagement',
  '@/pages/admin/AdminCostOptimization',
  '@/pages/admin/AdminBatchShipping',
  '@/pages/admin/AdminWebhookManagement',
] as const;

export function auditForbiddenDashboardAdminImports(dashboardSource: string): string[] {
  return FORBIDDEN_DASHBOARD_ADMIN_IMPORTS.filter(prefix => dashboardSource.includes(prefix));
}

/** Emplacement canonique P4 — modules produits physiques vendeur. */
export const SELLER_PHYSICAL_CANONICAL_PREFIX = '@/pages/dashboard/physical/' as const;

export const SELLER_PHYSICAL_CANONICAL_FILES = [
  'PhysicalInventoryManagement.tsx',
  'PhysicalPromotions.tsx',
  'PhysicalProductsAnalytics.tsx',
  'PhysicalProductsSerialTracking.tsx',
  'PhysicalBarcodeScanner.tsx',
  'PhysicalPreOrders.tsx',
  'PhysicalBackorders.tsx',
  'PhysicalBundles.tsx',
  'PhysicalMultiCurrency.tsx',
  'PhysicalProductsLots.tsx',
  'PhysicalProductWebhooks.tsx',
] as const;

const SELLER_PHYSICAL_WRAPPER_DIR = join(REPO_ROOT, 'src/pages/dashboard/seller');

/** Vérifie que les wrappers SellerPhysical* réexportent depuis dashboard/physical (P4). */
export function auditSellerPhysicalWrapperSources(): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const mod of SELLER_PHYSICAL_PAGE_MODULES) {
    if (mod === 'SellerIntegrationsPage') continue;
    const filePath = join(SELLER_PHYSICAL_WRAPPER_DIR, `${mod}.tsx`);
    const source = readFileSync(filePath, 'utf8');
    if (source.includes('@/pages/admin/Physical')) {
      violations.push(`${mod} importe encore depuis pages/admin/Physical`);
    }
    if (!source.includes(SELLER_PHYSICAL_CANONICAL_PREFIX)) {
      violations.push(`${mod} doit réexporter depuis ${SELLER_PHYSICAL_CANONICAL_PREFIX}`);
    }
  }
  return { ok: violations.length === 0, violations };
}

/** Emplacement canonique P5 — intégrations boutique vendeur. */
export const SELLER_INTEGRATIONS_CANONICAL_PREFIX = '@/pages/dashboard/integrations/' as const;

export const SELLER_INTEGRATIONS_CANONICAL_FILES = ['IntegrationsPage.tsx'] as const;

/** Shims admin supprimés en P5 — ces fichiers ne doivent plus exister. */
export const REMOVED_ADMIN_PHYSICAL_SHIMS = [
  'src/pages/admin/PhysicalInventoryManagement.tsx',
  'src/pages/admin/PhysicalPromotions.tsx',
  'src/pages/admin/PhysicalProductsAnalytics.tsx',
  'src/pages/admin/PhysicalProductsSerialTracking.tsx',
  'src/pages/admin/PhysicalBarcodeScanner.tsx',
  'src/pages/admin/PhysicalPreOrders.tsx',
  'src/pages/admin/PhysicalBackorders.tsx',
  'src/pages/admin/PhysicalBundles.tsx',
  'src/pages/admin/PhysicalMultiCurrency.tsx',
  'src/pages/admin/PhysicalProductsLots.tsx',
  'src/pages/admin/PhysicalProductWebhooks.tsx',
  'src/pages/admin/IntegrationsPage.tsx',
] as const;

export function auditRemovedAdminShims(): string[] {
  const stillPresent: string[] = [];
  for (const relPath of REMOVED_ADMIN_PHYSICAL_SHIMS) {
    try {
      readFileSync(join(REPO_ROOT, relPath), 'utf8');
      stillPresent.push(relPath);
    } catch {
      /* absent — attendu */
    }
  }
  return stillPresent;
}

export function auditSellerIntegrationsWrapperSource(): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const filePath = join(SELLER_PHYSICAL_WRAPPER_DIR, 'SellerIntegrationsPage.tsx');
  const source = readFileSync(filePath, 'utf8');
  if (source.includes('@/pages/admin/IntegrationsPage')) {
    violations.push('SellerIntegrationsPage importe encore depuis pages/admin/IntegrationsPage');
  }
  if (!source.includes(SELLER_INTEGRATIONS_CANONICAL_PREFIX)) {
    violations.push(
      `SellerIntegrationsPage doit réexporter depuis ${SELLER_INTEGRATIONS_CANONICAL_PREFIX}`
    );
  }
  return { ok: violations.length === 0, violations };
}

export function auditIntegrationsCanonicalFilesExist(): string[] {
  const missing: string[] = [];
  for (const file of SELLER_INTEGRATIONS_CANONICAL_FILES) {
    try {
      readFileSync(join(REPO_ROOT, 'src/pages/dashboard/integrations', file), 'utf8');
    } catch {
      missing.push(file);
    }
  }
  return missing;
}

export function auditPhysicalCanonicalFilesExist(): string[] {
  const missing: string[] = [];
  for (const file of SELLER_PHYSICAL_CANONICAL_FILES) {
    try {
      readFileSync(join(REPO_ROOT, 'src/pages/dashboard/physical', file), 'utf8');
    } catch {
      missing.push(file);
    }
  }
  return missing;
}

export const SELLER_PREFIX_INCONSISTENCIES: readonly {
  path: string;
  suggestedPrefix: string;
  status: 'redirect' | 'open';
}[] = [
  {
    path: '/courses/:courseId/gamification',
    suggestedPrefix: '/dashboard/courses/',
    status: 'redirect',
  },
  {
    path: '/courses/:slug/analytics',
    suggestedPrefix: '/dashboard/courses/',
    status: 'redirect',
  },
  { path: '/shipping', suggestedPrefix: '/dashboard/shipping', status: 'redirect' },
  { path: '/inventory', suggestedPrefix: '/dashboard/inventory', status: 'redirect' },
];

/** Patterns d'extraction — pr, protectedRoute (customer), Route path= (redirects/subdomain). */
export const ROUTE_PATH_EXTRACTION_PATTERNS: readonly RegExp[] = [
  /\bpr\(\s*['"]([^'"]+)['"]/g,
  /\bprotectedRoute\(\s*['"]([^'"]+)['"]/g,
  /<Route\s+path=["']([^"']+)["']/g,
];

/** Seuils minimum par module (régression couverture). */
export const PLATFORM_ROUTE_MODULE_MIN_COUNTS: Record<(typeof ROUTE_FILES)[number], number> = {
  'src/routes/publicRoutes.tsx': 65,
  'src/routes/customerRoutes.tsx': 16,
  'src/routes/dashboardRoutes.tsx': 95,
  'src/routes/adminRoutes.tsx': 60,
  'src/routes/storeSubdomainRoutes.tsx': 18,
};

/** Legacy autorisés comme alias fonctionnel (pas redirect strict). */
export const LEGACY_ALIAS_PATHS = new Set(['/dashboard/physical-lots-old']);

function routeDeclarationRedirects(source: string, routePath: string): boolean {
  const idx =
    source.indexOf(`path="${routePath}"`) >= 0
      ? source.indexOf(`path="${routePath}"`)
      : source.indexOf(`path='${routePath}'`);
  if (idx < 0) return true;
  const snippet = source.slice(idx, idx + 500);
  return (
    snippet.includes('<Navigate') ||
    snippet.includes('SellerLegacyPathRedirect') ||
    snippet.includes('CheckoutLegacyRedirect') ||
    snippet.includes('LegacyRedirect')
  );
}

export function extractRoutePaths(source: string): string[] {
  const paths = new Set<string>();
  for (const pattern of ROUTE_PATH_EXTRACTION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
      paths.add(match[1]);
    }
  }
  return [...paths].sort();
}

export function loadAllPlatformRoutePaths(): Record<(typeof ROUTE_FILES)[number], string[]> {
  const result = {} as Record<(typeof ROUTE_FILES)[number], string[]>;
  for (const file of ROUTE_FILES) {
    const content = readFileSync(join(REPO_ROOT, file), 'utf8');
    result[file] = extractRoutePaths(content);
  }
  return result;
}

export function countPlatformRoutes(
  byFile: Record<string, string[]> = loadAllPlatformRoutePaths()
): { total: number; byModule: Record<string, number> } {
  const byModule: Record<string, number> = {};
  let total = 0;
  for (const [file, paths] of Object.entries(byFile)) {
    byModule[file] = paths.length;
    total += paths.length;
  }
  return { total, byModule };
}

export function auditCapabilityGating(pathname: string, commerceType: StoreCommerceType): boolean {
  return canAccessCommercePath(pathname, commerceType);
}

export function findCapabilityPrefixCollisions(
  dashboardPaths: string[],
  commerceType: StoreCommerceType
): string[] {
  return dashboardPaths.filter(path => {
    if (!path.startsWith('/dashboard')) return false;
    const rule = getRouteCapabilityRule(path);
    return rule != null && !canAccessCommercePath(path, commerceType);
  });
}

export function auditVendorPrefetchAlignment(commerceType: StoreCommerceType): {
  ok: boolean;
  listPath: string;
  idleRoutes: readonly string[];
} {
  const listPath = getVendorProductListPath(commerceType);
  const idleRoutes = getVendorIdleRoutes(commerceType);
  const ok = idleRoutes.includes(listPath) && !idleRoutes.includes('/dashboard/products');
  return { ok, listPath, idleRoutes };
}

export function auditDocumentedLinksRegistered(
  dashboardPaths: string[],
  documentedLinks: readonly string[] = DOCUMENTED_VENDOR_LINKS
): { missing: string[]; covered: string[] } {
  const missing: string[] = [];
  const covered: string[] = [];
  for (const link of documentedLinks) {
    if (dashboardPaths.includes(link)) {
      covered.push(link);
    } else {
      missing.push(link);
    }
  }
  return { missing, covered };
}

export function auditPhysicalOnlyPaths(
  dashboardPaths: string[],
  dashboardSource?: string
): string[] {
  const source =
    dashboardSource ?? readFileSync(join(REPO_ROOT, 'src/routes/dashboardRoutes.tsx'), 'utf8');
  return dashboardPaths.filter(p => {
    if (!p.includes('physical') || !p.startsWith('/dashboard')) return false;
    if (isPhysicalOnlySellerPath(p)) return false;
    if (routeDeclarationRedirects(source, p)) return false;
    return true;
  });
}

export function summarizePlatformRouteAudit(): {
  counts: ReturnType<typeof countPlatformRoutes>;
  verticalListPaths: typeof VENDOR_PRODUCT_LIST_PATH_BY_TYPE;
  legacyDebt: typeof LEGACY_ROUTE_DEBT;
  prefixInconsistencies: typeof SELLER_PREFIX_INCONSISTENCIES;
} {
  return {
    counts: countPlatformRoutes(),
    verticalListPaths: VENDOR_PRODUCT_LIST_PATH_BY_TYPE,
    legacyDebt: LEGACY_ROUTE_DEBT,
    prefixInconsistencies: SELLER_PREFIX_INCONSISTENCIES,
  };
}

export function loadAllPlatformRouteSources(): Record<(typeof ROUTE_FILES)[number], string> {
  const result = {} as Record<(typeof ROUTE_FILES)[number], string>;
  for (const file of ROUTE_FILES) {
    result[file] = readFileSync(join(REPO_ROOT, file), 'utf8');
  }
  return result;
}

export function auditRouteModuleMinimums(
  byFile: Record<string, string[]> = loadAllPlatformRoutePaths()
): {
  ok: boolean;
  gaps: Partial<Record<(typeof ROUTE_FILES)[number], { actual: number; minimum: number }>>;
} {
  const gaps: Partial<Record<(typeof ROUTE_FILES)[number], { actual: number; minimum: number }>> =
    {};
  for (const [file, minimum] of Object.entries(PLATFORM_ROUTE_MODULE_MIN_COUNTS) as [
    (typeof ROUTE_FILES)[number],
    number,
  ][]) {
    const actual = byFile[file]?.length ?? 0;
    if (actual < minimum) {
      gaps[file] = { actual, minimum };
    }
  }
  return { ok: Object.keys(gaps).length === 0, gaps };
}

export function findIntraModuleDuplicateRoutes(
  byFile: Record<string, string[]> = loadAllPlatformRoutePaths()
): Record<string, string[]> {
  const duplicates: Record<string, string[]> = {};
  for (const [file, paths] of Object.entries(byFile)) {
    const seen = new Map<string, number>();
    for (const path of paths) {
      seen.set(path, (seen.get(path) ?? 0) + 1);
    }
    const dups = [...seen.entries()].filter(([, count]) => count > 1).map(([path]) => path);
    if (dups.length > 0) duplicates[file] = dups;
  }
  return duplicates;
}

/** Legacy déclarés doivent rediriger (sauf alias documentés). */
export function auditLegacyRoutesRedirectOnly(
  sources: Record<string, string> = loadAllPlatformRouteSources()
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const legacy of LEGACY_ROUTE_DEBT) {
    if (LEGACY_ALIAS_PATHS.has(legacy.path)) continue;
    for (const [file, src] of Object.entries(sources)) {
      if (!src.includes(`path="${legacy.path}"`) && !src.includes(`path='${legacy.path}'`)) {
        continue;
      }
      if (!routeDeclarationRedirects(src, legacy.path)) {
        violations.push(`${legacy.path} dans ${file} sans redirect explicite`);
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

export type FullPlatformRouteAuditResult = {
  ok: boolean;
  totalRoutes: number;
  byModule: Record<string, number>;
  failures: string[];
};

/** Point d'entrée unique — audit complet plateforme (CI). */
export function runFullPlatformRouteAudit(): FullPlatformRouteAuditResult {
  const routes = loadAllPlatformRoutePaths();
  const { total, byModule } = countPlatformRoutes(routes);
  const failures: string[] = [];

  const moduleMin = auditRouteModuleMinimums(routes);
  if (!moduleMin.ok) {
    for (const [file, gap] of Object.entries(moduleMin.gaps)) {
      failures.push(`${file}: ${gap!.actual} routes < minimum ${gap!.minimum}`);
    }
  }

  const dups = findIntraModuleDuplicateRoutes(routes);
  for (const [file, paths] of Object.entries(dups)) {
    failures.push(`${file}: routes dupliquées ${paths.join(', ')}`);
  }

  const legacy = auditLegacyRoutesRedirectOnly();
  failures.push(...legacy.violations);

  failures.push(
    ...auditForbiddenDashboardAdminImports(
      loadAllPlatformRouteSources()['src/routes/dashboardRoutes.tsx']
    ).map(v => `dashboardRoutes import interdit: ${v}`)
  );

  failures.push(...auditRemovedAdminShims().map(p => `shim admin encore présent: ${p}`));
  failures.push(...auditPhysicalCanonicalFilesExist().map(f => `physical manquant: ${f}`));
  failures.push(...auditIntegrationsCanonicalFilesExist().map(f => `integrations manquant: ${f}`));
  failures.push(...auditSellerPhysicalWrapperSources().violations);
  failures.push(...auditSellerIntegrationsWrapperSource().violations);

  const { missing } = auditDocumentedLinksRegistered(routes['src/routes/dashboardRoutes.tsx']);
  failures.push(...missing.map(l => `lien nav sans route: ${l}`));

  for (const type of ['digital', 'course', 'artist', 'service', 'physical'] as const) {
    if (!auditVendorPrefetchAlignment(type).ok) {
      failures.push(`prefetch vendeur non aligné: ${type}`);
    }
  }

  const physicalGaps = auditPhysicalOnlyPaths(routes['src/routes/dashboardRoutes.tsx']);
  if (physicalGaps.length > 0) {
    failures.push(`physical hors PHYSICAL_ONLY: ${physicalGaps.join(', ')}`);
  }

  if (total < 280) {
    failures.push(`total routes ${total} < seuil global 280`);
  }

  return { ok: failures.length === 0, totalRoutes: total, byModule, failures };
}
