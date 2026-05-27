import { DEFAULT_PERMISSION_KEYS } from '@/hooks/useAdminPermissions';

export type EffectivePermissions = Record<string, boolean>;

export const PLATFORM_ROLE_PRIORITY = [
  'super_admin',
  'admin',
  'manager',
  'moderator',
  'support',
  'viewer',
] as const;

export type PlatformRoleName = (typeof PLATFORM_ROLE_PRIORITY)[number];

export function normalizeRolePermissions(raw: unknown): EffectivePermissions {
  if (!raw || typeof raw !== 'object') return {};
  const out: EffectivePermissions = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = Boolean(value);
  }
  return out;
}

export function resolvePlatformRole(options: {
  isSuperAdmin: boolean;
  profileRole: string | null;
  hasAdminRole: boolean;
  hasModeratorRole: boolean;
}): PlatformRoleName | null {
  if (options.isSuperAdmin) return 'super_admin';
  if (options.hasAdminRole || options.profileRole === 'admin') return 'admin';
  if (options.hasModeratorRole || options.profileRole === 'staff') return 'moderator';
  if (options.profileRole === 'manager') return 'manager';
  if (options.profileRole === 'support') return 'support';
  if (options.profileRole === 'viewer') return 'viewer';
  return null;
}

export function fallbackPermissionsForRole(role: PlatformRoleName): EffectivePermissions {
  const none = Object.fromEntries(
    DEFAULT_PERMISSION_KEYS.map(k => [k, false])
  ) as EffectivePermissions;
  switch (role) {
    case 'super_admin':
    case 'admin':
      return Object.fromEntries(
        DEFAULT_PERMISSION_KEYS.map(k => [k, true])
      ) as EffectivePermissions;
    case 'manager':
      return {
        ...none,
        'products.manage': true,
        'orders.manage': true,
        'payments.manage': true,
        'disputes.manage': true,
        'emails.manage': true,
        'analytics.view': true,
      };
    case 'moderator':
      return {
        ...none,
        'products.manage': true,
        'orders.manage': true,
        'disputes.manage': true,
        'analytics.view': true,
      };
    case 'support':
      return {
        ...none,
        'orders.manage': true,
        'disputes.manage': true,
        'analytics.view': true,
      };
    case 'viewer':
      return { ...none, 'analytics.view': true };
    default:
      return none;
  }
}
