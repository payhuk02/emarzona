import type { TFunction } from 'i18next';
import { ShoppingCart, User } from 'lucide-react';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import {
  enrichNavSections,
  filterNavSections,
  flattenNavSections,
} from '@/config/navigation.enrich';
import { getNavItemPath } from '@/config/navigation.helpers';
import { resolveNavItemIcon } from '@/config/navigation.icons';
import { translateNavSections } from '@/config/navigation.i18n';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import {
  filterAdminNavSectionsByRbac,
  filterSellerNavSectionsByAccess,
} from '@/config/navigation.rbac';
import type { FlatNavEntry, NavItem, NavSection, SidebarPersona } from '@/config/navigation.types';
import { isNavPathPlanLocked } from '@/lib/navigation/plan-lock-nav';
import { resolveSellerNavPath, resolveSellerNavUrl } from '@/lib/navigation/vendor-products-nav';

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

/** Mobile bottom nav — persona acheteur */
export const BUYER_BOTTOM_NAV_SPECS: BottomNavSpec[] = [
  {
    path: '/account',
    fromMenu: false,
    titleKey: 'sidebar.chrome.bottomNavAccount',
    defaultTitle: 'Compte',
    icon: User,
  },
  { path: '/marketplace', fromMenu: true },
  {
    path: '/cart',
    fromMenu: false,
    titleKey: 'sidebar.chrome.bottomNavCart',
    defaultTitle: 'Panier',
    icon: ShoppingCart,
  },
  { path: '/account/orders', fromMenu: true },
  { path: '/notifications', fromMenu: true },
];

export type NavSurface = 'sidebar' | 'command' | 'topnav' | 'bottomnav';

export type ResolvedNavItem = {
  title: string;
  url: string;
  path: string;
  icon: NavItem['icon'];
  locked: boolean;
};

export type ResolveNavSectionsInput = {
  scope: 'sidebar' | 'command' | 'admin';
  persona: SidebarPersona;
  isPlatformAdmin: boolean;
  commerceType?: StoreCommerceType | null;
  can?: (key: string) => boolean;
  isSuperAdmin?: boolean;
  isExpertMode?: boolean;
  t?: TFunction;
};

export type ResolveNavItemsInput = Omit<ResolveNavSectionsInput, 'scope'> & {
  surface: NavSurface;
  physicalPlanSlug?: string | null;
};

const enrichedUserSections = enrichNavSections(userMenuSections);
const enrichedAdminSections = enrichNavSections(adminMenuSections);

function toResolvedNavItem(
  entry: FlatNavEntry,
  planSlug?: string | null,
  commerceType?: StoreCommerceType | null
): ResolvedNavItem {
  const path = resolveSellerNavPath(getNavItemPath(entry.url), commerceType);
  return {
    title: entry.title,
    url: resolveSellerNavUrl(entry.url, commerceType),
    path,
    icon: resolveNavItemIcon(entry.url, entry.icon),
    locked: isNavPathPlanLocked(path, planSlug, commerceType),
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
    commerceType: input.commerceType,
    isExpertMode: input.isExpertMode,
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
    commerceType: input.commerceType,
    can: input.can,
    isSuperAdmin: input.isSuperAdmin,
    isExpertMode: input.isExpertMode,
    t: input.t,
  });

  const flat = flattenNavSections(sections);
  const byPath = new Map(flat.map(entry => [getNavItemPath(entry.url), entry]));
  const planSlug = input.physicalPlanSlug;
  const commerceType = input.commerceType;

  if (input.surface === 'topnav') {
    return TOP_NAV_PRIMARY_PATHS.map(path => byPath.get(path))
      .filter((entry): entry is FlatNavEntry => Boolean(entry))
      .map(entry => toResolvedNavItem(entry, planSlug, commerceType));
  }

  if (input.surface === 'bottomnav') {
    const commandSections = resolveNavSections({
      scope: 'command',
      persona: input.persona,
      isPlatformAdmin: input.isPlatformAdmin,
      commerceType: input.commerceType,
      can: input.can,
      isSuperAdmin: input.isSuperAdmin,
      isExpertMode: input.isExpertMode,
      t: input.t,
    });
    const flat = flattenNavSections(commandSections);
    const byPath = new Map(flat.map(entry => [getNavItemPath(entry.url), entry]));
    const specs = input.persona === 'buyer' ? BUYER_BOTTOM_NAV_SPECS : BOTTOM_NAV_SPECS;
    const { t } = input;

    return specs
      .map(spec => {
        if (spec.fromMenu === true) {
          const entry = byPath.get(spec.path);
          if (!entry) return null;
          return toResolvedNavItem(entry, planSlug, commerceType);
        }
        return {
          path: spec.path,
          url: spec.path,
          title: String(
            t?.(spec.titleKey, { defaultValue: spec.defaultTitle }) ?? spec.defaultTitle
          ),
          icon: spec.icon,
          locked: false,
        };
      })
      .filter((item): item is ResolvedNavItem => item !== null);
  }

  return flat.map(entry => toResolvedNavItem(entry, planSlug, commerceType));
}
