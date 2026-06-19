import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { getVendorProductListPath } from '@/lib/commerce/store-capability-map';
import { getNavItemPath } from '@/config/navigation.helpers';
import type { NavActiveMatchMode } from '@/config/navigation.helpers';
import { isNavItemActive } from '@/config/navigation.helpers';

/** Clé menu stable — résolue vers la liste verticale à l'exécution. */
export const VENDOR_PRODUCTS_HUB_PATH = '/dashboard/products' as const;

export function resolveSellerNavPath(
  path: string,
  commerceType?: StoreCommerceType | null
): string {
  const normalized = path.split('?')[0];
  if (normalized === VENDOR_PRODUCTS_HUB_PATH) {
    return getVendorProductListPath(commerceType);
  }
  return path;
}

export function resolveSellerNavUrl(url: string, commerceType?: StoreCommerceType | null): string {
  const [path, query] = url.split('?');
  const resolved = resolveSellerNavPath(path, commerceType);
  return query ? `${resolved}?${query}` : resolved;
}

export function isVendorProductsHubPath(pathname: string): boolean {
  return getNavItemPath(pathname) === VENDOR_PRODUCTS_HUB_PATH;
}

/** Active state : hub menu « Produits » + liste verticale courante. */
export function isSellerNavItemActive(
  itemUrl: string,
  pathname: string,
  search: string | undefined,
  mode: NavActiveMatchMode = 'exact',
  commerceType?: StoreCommerceType | null
): boolean {
  if (isNavItemActive(itemUrl, pathname, search, mode)) return true;
  if (getNavItemPath(itemUrl) !== VENDOR_PRODUCTS_HUB_PATH) return false;
  const verticalPath = getVendorProductListPath(commerceType);
  return isNavItemActive(verticalPath, pathname, search, mode);
}
