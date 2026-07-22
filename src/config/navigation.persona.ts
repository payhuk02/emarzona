import type { SidebarPersona } from '@/config/navigation.types';

/** Découverte & shopping public — barre horizontale acheteur */
export const BUYER_DISCOVERY_PATHS = [
  '/marketplace',
  '/auctions',
  '/recommendations',
  '/discover',
  '/trending',
  '/recommendations/history-based',
  '/personalization/quiz',
  '/personalization/recommendations',
] as const;

function matchesNavPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Routes publiques « Découvrir » (marketplace, enchères, recommandations IA). */
export function isBuyerDiscoveryPath(pathname: string): boolean {
  return BUYER_DISCOVERY_PATHS.some(path => matchesNavPath(pathname, path));
}

/**
 * Persona chrome unifiée (sidebar, horizontal, bottom).
 * Zones exclusives path → path gagne ; routes partagées → pin (sinon path).
 */
export function detectPersonaFromPath(pathname: string, isAdmin: boolean): SidebarPersona {
  if (pathname.startsWith('/admin') && isAdmin) return 'admin';
  if (pathname.startsWith('/account') || isBuyerDiscoveryPath(pathname)) {
    return 'buyer';
  }
  return 'seller';
}

function isSellerZone(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/affiliate')
  );
}

export function resolveNavPersona(
  pathname: string,
  isAdmin: boolean,
  pinnedPersona: SidebarPersona | null = null
): SidebarPersona {
  if (pathname.startsWith('/admin') && isAdmin) return 'admin';

  // Compte acheteur reste exclusif buyer (pin vendeur n'y change rien).
  if (pathname.startsWith('/account')) return 'buyer';

  // Marketplace / découverte : garder le chrome Vendre si l'utilisateur a épinglé seller
  // (lien Marketplace du rail vendeur ne doit plus forcer Acheter).
  if (isBuyerDiscoveryPath(pathname)) {
    if (pinnedPersona === 'seller') return 'seller';
    return 'buyer';
  }

  if (isSellerZone(pathname)) return 'seller';

  if (pinnedPersona === 'admin')
    return isAdmin ? 'admin' : detectPersonaFromPath(pathname, isAdmin);
  if (pinnedPersona === 'buyer' || pinnedPersona === 'seller') return pinnedPersona;

  return detectPersonaFromPath(pathname, isAdmin);
}

/** Horizontal / bottom nav n’exposent que seller|buyer (admin → seller). */
export function toCommerceNavPersona(persona: SidebarPersona): 'seller' | 'buyer' {
  return persona === 'buyer' ? 'buyer' : 'seller';
}
