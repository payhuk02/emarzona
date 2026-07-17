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

const getNavPath = (url: string) => url.split('?')[0];

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

  return sections
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
}
