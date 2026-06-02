import { ADMIN_NAV_SECTIONS, type AdminNavItem } from '@/lib/admin/admin-nav';

export type AdminRouteAccess = {
  permissions?: string[];
  superAdminOnly?: boolean;
};

function itemToAccess(item: AdminNavItem): AdminRouteAccess {
  return {
    permissions: item.permissions,
    superAdminOnly: item.superAdminOnly,
  };
}

/** Map path → règles d'accès (dérivée de la nav + extras). */
export const ADMIN_ROUTE_ACCESS: Record<string, AdminRouteAccess> = (() => {
  const map: Record<string, AdminRouteAccess> = {};
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      map[item.path] = itemToAccess(item);
    }
  }
  map['/admin/recommendation-insights'] = {
    permissions: ['analytics.view', 'settings.manage'],
  };
  return map;
})();

export function getAdminRouteAccess(pathname: string): AdminRouteAccess | null {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';

  if (ADMIN_ROUTE_ACCESS[normalized]) {
    return ADMIN_ROUTE_ACCESS[normalized];
  }

  const prefix = Object.keys(ADMIN_ROUTE_ACCESS)
    .filter(p => p !== '/admin' && (normalized.startsWith(`${p}/`) || normalized === p))
    .sort((a, b) => b.length - a.length)[0];

  if (prefix) {
    return ADMIN_ROUTE_ACCESS[prefix];
  }

  // Route admin inconnue : super-admin uniquement (fail-closed)
  return { superAdminOnly: true };
}

export function canAccessAdminPath(
  pathname: string,
  can: (key: string) => boolean,
  isSuperAdmin: boolean
): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';
  if (normalized === '/admin') return true;

  const access = getAdminRouteAccess(normalized);
  if (!access) return true;
  if (access.superAdminOnly && !isSuperAdmin) return false;
  if (isSuperAdmin) return true;
  if (!access.permissions?.length) return true;
  return access.permissions.some(p => can(p));
}
