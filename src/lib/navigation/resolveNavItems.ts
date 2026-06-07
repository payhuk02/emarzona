import type { TFunction } from 'i18next';
import { ShoppingCart, User } from 'lucide-react';
import {
  enrichNavSections,
  filterNavSections,
  flattenNavSections,
} from '@/config/navigation.enrich';
import { getNavItemPath } from '@/config/navigation.helpers';
import { translateNavSections } from '@/config/navigation.i18n';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import {
  filterAdminNavSectionsByRbac,
  filterSellerNavSectionsByAccess,
} from '@/config/navigation.rbac';
import type { FlatNavEntry, NavItem, NavSection, SidebarPersona } from '@/config/navigation.types';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import { requiredPhysicalFeatureForPath } from '@/lib/billing/physical-route-capabilities';

/** Ordered links for horizontal top nav (MainLayout seller chrome). */
export const TOP_NAV_PRIMARY_PATHS = [
  '/dashboard',
  '/dashboard/products',
  '/dashboard/orders',
  '/dashboard/customers',
  '/dashboard/marketing',
  '/dashboard/emails/campaigns',
  '/dashboard/analytics',
  '/dashboard/settings',
] as const;

type BottomNavSpec =
  | { path: string; fromMenu: true }
  | {
      path: string;
      fromMenu: false;
      titleKey: string;
      defaultTitle: string;
      icon: NavItem['icon'];
    };

/** Mobile bottom nav — menu-backed + fixed shortcuts (cart, account). */
export const BOTTOM_NAV_SPECS: BottomNavSpec[] = [
  { path: '/dashboard', fromMenu: true },
  { path: '/dashboard/store', fromMenu: true },
  { path: '/dashboard/products', fromMenu: true },
  {
    path: '/cart',
    fromMenu: false,
    titleKey: 'sidebar.chrome.bottomNavCart',
    defaultTitle: 'Panier',
    icon: ShoppingCart,
  },
  {
    path: '/account',
    fromMenu: false,
    titleKey: 'sidebar.chrome.bottomNavAccount',
    defaultTitle: 'Compte',
    icon: User,
  },
];

export type NavSurface = 'sidebar' | 'command' | 'topnav' | 'bottomnav';

export type ResolvedNavItem = {
  title: string;
  url: string;
  path: string;
  icon: NavItem['icon'];
};

export type ResolveNavSectionsInput = {
  scope: 'sidebar' | 'command' | 'admin';
  persona: SidebarPersona;
  isPlatformAdmin: boolean;
  can?: (key: string) => boolean;
  isSuperAdmin?: boolean;
  t?: TFunction;
};

export type ResolveNavItemsInput = Omit<ResolveNavSectionsInput, 'scope'> & {
  surface: NavSurface;
  physicalPlanSlug?: string | null;
};

const enrichedUserSections = enrichNavSections(userMenuSections);
const enrichedAdminSections = enrichNavSections(adminMenuSections);

function isNavItemPlanLocked(path: string, planSlug: string | null | undefined): boolean {
  const feature = requiredPhysicalFeatureForPath(path);
  if (!feature) return false;
  if (!planSlug) return true;
  return !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature);
}

function toResolvedNavItem(entry: FlatNavEntry): ResolvedNavItem {
  const path = getNavItemPath(entry.url);
  return {
    title: entry.title,
    url: entry.url,
    path,
    icon: entry.icon,
  };
}

/** Shared section pipeline for AppSidebar, command palette, and flat surfaces. */
export function resolveNavSections(input: ResolveNavSectionsInput): NavSection[] {
  const navPersona: SidebarPersona = input.persona === 'buyer' ? 'buyer' : 'seller';
  const sidebarOnly = input.scope === 'sidebar';
  const { t } = input;
  const can = input.can ?? (() => false);
  const isSuperAdmin = input.isSuperAdmin ?? false;

  if (input.scope === 'admin') {
    const filtered = filterAdminNavSectionsByRbac(enrichedAdminSections, can, isSuperAdmin);
    return t ? translateNavSections(filtered, t) : filtered;
  }

  let sections = filterNavSections(enrichedUserSections, navPersona, { sidebarOnly });
  sections = filterSellerNavSectionsByAccess(sections, {
    isPlatformAdmin: input.isPlatformAdmin,
  });
  return t ? translateNavSections(sections, t) : sections;
}

/** Flat navigation items for top nav, bottom nav, or diagnostics. */
export function resolveNavItems(input: ResolveNavItemsInput): ResolvedNavItem[] {
  const sectionScope: ResolveNavSectionsInput['scope'] =
    input.surface === 'command' ? 'command' : 'sidebar';

  const sections = resolveNavSections({
    scope: sectionScope,
    persona: input.persona,
    isPlatformAdmin: input.isPlatformAdmin,
    can: input.can,
    isSuperAdmin: input.isSuperAdmin,
    t: input.t,
  });

  const flat = flattenNavSections(sections);
  const byPath = new Map(flat.map(entry => [getNavItemPath(entry.url), entry]));

  const includePath = (path: string) => !isNavItemPlanLocked(path, input.physicalPlanSlug);

  if (input.surface === 'topnav') {
    return TOP_NAV_PRIMARY_PATHS.map(path => byPath.get(path))
      .filter((entry): entry is FlatNavEntry => Boolean(entry))
      .filter(entry => includePath(getNavItemPath(entry.url)))
      .map(toResolvedNavItem);
  }

  if (input.surface === 'bottomnav') {
    const { t } = input;
    return BOTTOM_NAV_SPECS.map(spec => {
      if (spec.fromMenu === true) {
        const entry = byPath.get(spec.path);
        if (!entry || !includePath(spec.path)) return null;
        return toResolvedNavItem(entry);
      }
      return {
        path: spec.path,
        url: spec.path,
        title: String(t?.(spec.titleKey, { defaultValue: spec.defaultTitle }) ?? spec.defaultTitle),
        icon: spec.icon,
      };
    }).filter((item): item is ResolvedNavItem => item !== null);
  }

  return flat.filter(entry => includePath(getNavItemPath(entry.url))).map(toResolvedNavItem);
}
