/**
 * Visibilité du chrome boutique (header hero / footer) sur les routes subdomain.
 */

/** Pas de chrome boutique sur checkout / paiements / auth (plein contenu). */
export function shouldShowStoreChrome(pathname: string): boolean {
  if (pathname.startsWith('/checkout')) return false;
  if (pathname.startsWith('/pay')) return false;
  if (pathname.startsWith('/payment')) return false;
  if (
    pathname === '/login' ||
    pathname === '/connexion' ||
    pathname === '/register' ||
    pathname === '/signup' ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/')
  ) {
    return false;
  }
  if (pathname.startsWith('/vendor/messaging')) return false;
  return true;
}

/**
 * Hero bannière + logo : réservé à l'accueil / listes boutique.
 * Sur les fiches produit, le média produit prime (évite bannière + logo + image produit).
 */
export function shouldShowStoreHeader(pathname: string): boolean {
  if (!shouldShowStoreChrome(pathname)) return false;
  if (pathname.startsWith('/products/')) return false;
  if (pathname.startsWith('/service/')) return false;
  if (pathname.startsWith('/artist/')) return false;
  if (/^\/auctions\/[^/]+/.test(pathname)) return false;
  if (/^\/collections\/[^/]+/.test(pathname)) return false;
  return true;
}
