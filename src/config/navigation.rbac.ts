import { canAccessAdminPath } from '@/lib/admin/admin-route-permissions';
import { getNavItemPath } from '@/config/navigation.helpers';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import type { NavSection } from '@/config/navigation.types';
import {
  isPhysicalOnlyNavUrl,
  shouldApplyPhysicalPlanGating,
} from '@/lib/billing/store-commerce-access';
import {
  canAccessCommercePath,
  canAccessProductCreateNavPath,
} from '@/lib/commerce/store-capability-map';
import { requiresExpertMode } from '@/config/navigation.progressive';
import {
  resolveSellerNavUrl,
  VENDOR_PRODUCTS_HUB_PATH,
} from '@/lib/navigation/vendor-products-nav';

const getNavPath = (url: string) => url.split('?')[0];

/**
 * Hub « Produits » (/dashboard/products) resolves to the vertical list path
 * (e.g. /dashboard/digital-products). Drop later duplicates so sidebar E2E
 * and deep links see exactly one anchor per href.
 */
export function dedupeNavSectionsByResolvedHref(
  sections: NavSection[],
  commerceType?: StoreCommerceType | null
): NavSection[] {
  return sections
    .map(section => {
      type ItemRef = {
        item: NavSection['items'][number];
        href: string;
        isExplicit: boolean;
      };

      const refs: ItemRef[] = section.items.map(item => {
        const href = resolveSellerNavUrl(item.url, commerceType).split('?')[0];
        const originalPath = getNavPath(item.url);
        return { item, href, isExplicit: originalPath === href };
      });

      const refsByHref = new Map<string, ItemRef[]>();
      for (const ref of refs) {
        const list = refsByHref.get(ref.href) ?? [];
        list.push(ref);
        refsByHref.set(ref.href, list);
      }

      const keepUrls = new Set<string>();
      for (const dupes of refsByHref.values()) {
        if (dupes.length === 1) {
          keepUrls.add(dupes[0].item.url);
          continue;
        }
        const hub = dupes.find(ref => getNavPath(ref.item.url) === VENDOR_PRODUCTS_HUB_PATH);
        const explicit = dupes.find(ref => ref.isExplicit);
        keepUrls.add((hub ?? explicit ?? dupes[0]).item.url);
      }

      return {
        ...section,
        items: section.items.filter(item => keepUrls.has(item.url)),
      };
    })
    .filter(section => section.items.length > 0);
}

/**
 * Admin sidebar: RBAC on /admin/* routes; vendor shortcut links (/dashboard/*) visible to all admins.
 */
export function filterAdminNavSectionsByRbac(
  sections: NavSection[],
  can: (key: string) => boolean,
  isSuperAdmin: boolean
): NavSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const path = getNavPath(item.url);
        if (path.startsWith('/dashboard') || path === '/collections') return true;
        if (path.startsWith('/admin')) {
          return canAccessAdminPath(path, can, isSuperAdmin);
        }
        return true;
      }),
    }))
    .filter(section => section.items.length > 0);
}

/** Seller nav: hide items that require platform admin (future-proof). */
export function filterSellerNavSectionsByAccess(
  sections: NavSection[],
  options: {
    isPlatformAdmin: boolean;
    commerceType?: StoreCommerceType | null;
    storeMetadata?: Record<string, unknown> | null;
    isExpertMode?: boolean;
  }
): NavSection[] {
  const hidePhysicalOnly =
    options.commerceType != null && !shouldApplyPhysicalPlanGating(options.commerceType);
  const isExpert = options.isExpertMode ?? true; // Par défaut on affiche tout si non fourni
  const accessOptions = { storeMetadata: options.storeMetadata };

  const filtered = sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!options.isPlatformAdmin && item.adminOnly) return false;
        if (hidePhysicalOnly && isPhysicalOnlyNavUrl(item.url)) return false;

        // 🔒 Filtrage UX Progressive : Masquer les routes complexes si mode "Essentiel"
        if (!isExpert && requiresExpertMode(item.url)) return false;
        const path = getNavItemPath(item.url);
        if (
          item.createGroup &&
          !canAccessProductCreateNavPath(path, options.commerceType, accessOptions)
        ) {
          return false;
        }
        if (!canAccessCommercePath(path, options.commerceType, accessOptions)) return false;
        return true;
      }),
    }))
    .filter(section => section.items.length > 0);

  return dedupeNavSectionsByResolvedHref(filtered, options.commerceType);
}
