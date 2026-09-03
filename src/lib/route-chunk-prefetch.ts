/**
 * Prefetch des chunks JS de pages (dynamic import), pas du document HTML.
 * Aligné sur les lazyPage() des route modules pour les hot paths idle/hover.
 */

import { normalizePrefetchPath } from '@/lib/normalize-prefetch-path';

export type RouteChunkImporter = () => Promise<unknown>;
export { normalizePrefetchPath };

const ROUTE_CHUNK_IMPORTS: Record<string, RouteChunkImporter> = {
  '/marketplace': () => import('@/pages/Marketplace'),
  '/cart': () => import('@/pages/CartEnhanced'),
  '/checkout': () => import('@/pages/checkout/CheckoutPage'),
  '/account': () => import('@/pages/customer/CustomerPortal'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/dashboard/orders': () => import('@/pages/Orders'),
  '/dashboard/digital-products': () => import('@/pages/digital/DigitalProductsList'),
  '/dashboard/physical-products': () => import('@/pages/physical/PhysicalProductsList'),
  '/dashboard/services': () => import('@/pages/service/ServicesList'),
  '/dashboard/courses': () => import('@/pages/courses/SellerCoursesList'),
  '/dashboard/artist-products': () => import('@/pages/artist/SellerArtistProductsList'),
  '/dashboard/products/new': () => import('@/pages/CreateProduct'),
  '/dashboard/products/new/physical': () => import('@/pages/CreateProduct'),
  '/dashboard/products/new/digital': () => import('@/pages/CreateProduct'),
  '/dashboard/products/new/service': () => import('@/pages/CreateProduct'),
  '/dashboard/products/new/artist': () => import('@/pages/CreateProduct'),
  '/dashboard/courses/new': () => import('@/pages/courses/CreateCourse'),
};

const prefetched = new Set<string>();

export function getRouteChunkImporter(route: string): RouteChunkImporter | undefined {
  return ROUTE_CHUNK_IMPORTS[normalizePrefetchPath(route)];
}

/**
 * Précharge le module page associé à la route (no-op si inconnu ou déjà fait).
 * Retourne true si un import a été déclenché.
 */
export function prefetchRouteChunk(route: string): boolean {
  const path = normalizePrefetchPath(route);
  if (prefetched.has(path)) return false;

  const importer = ROUTE_CHUNK_IMPORTS[path];
  if (!importer) return false;

  prefetched.add(path);
  void importer().catch(() => {
    prefetched.delete(path);
  });
  return true;
}

/** Test helper — reset du cache mémoire des prefetch. */
export function __resetRouteChunkPrefetchCacheForTests(): void {
  prefetched.clear();
}
