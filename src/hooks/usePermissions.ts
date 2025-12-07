/**
 * Hook usePermissions - Gestion simplifiée des permissions
 * Fournit une API simple pour vérifier les permissions
 * 
 * @example
 * ```tsx
 * const { can, hasAny, hasAll } = usePermissions(permissions);
 * 
 * {can('products.manage') && <Button>Create Product</Button>}
 * ```
 */

import { useMemo, useCallback } from 'react';

export type Permission = string;
export type Permissions = Record<Permission, boolean> | Permission[];

export interface UsePermissionsOptions {
  /**
   * Si true, toutes les permissions sont accordées (super admin)
   * @default false
   */
  isSuperAdmin?: boolean;
}

export interface UsePermissionsReturn {
  /**
   * Vérifie si une permission est accordée
   */
  can: (permission: Permission) => boolean;
  /**
   * Vérifie si au moins une permission est accordée
   */
  hasAny: (permissions: Permission[]) => boolean;
  /**
   * Vérifie si toutes les permissions sont accordées
   */
  hasAll: (permissions: Permission[]) => boolean;
  /**
   * Vérifie si aucune permission n'est accordée
   */
  hasNone: (permissions: Permission[]) => boolean;
}

/**
 * Normalise les permissions en objet
 */
function normalizePermissions(permissions: Permissions): Record<Permission, boolean> {
  if (Array.isArray(permissions)) {
    return permissions.reduce((acc, perm) => {
      acc[perm] = true;
      return acc;
    }, {} as Record<Permission, boolean>);
  }
  return permissions;
}

/**
 * Hook pour gérer les permissions
 */
export function usePermissions(
  permissions: Permissions,
  options: UsePermissionsOptions = {}
): UsePermissionsReturn {
  const { isSuperAdmin = false } = options;

  const normalizedPermissions = useMemo(() => normalizePermissions(permissions), [permissions]);

  const can = useCallback(
    (permission: Permission): boolean => {
      if (isSuperAdmin) return true;
      return Boolean(normalizedPermissions[permission]);
    },
    [normalizedPermissions, isSuperAdmin]
  );

  const hasAny = useCallback(
    (permissionList: Permission[]): boolean => {
      if (isSuperAdmin) return true;
      return permissionList.some((perm) => normalizedPermissions[perm]);
    },
    [normalizedPermissions, isSuperAdmin]
  );

  const hasAll = useCallback(
    (permissionList: Permission[]): boolean => {
      if (isSuperAdmin) return true;
      return permissionList.every((perm) => normalizedPermissions[perm]);
    },
    [normalizedPermissions, isSuperAdmin]
  );

  const hasNone = useCallback(
    (permissionList: Permission[]): boolean => {
      if (isSuperAdmin) return false;
      return !permissionList.some((perm) => normalizedPermissions[perm]);
    },
    [normalizedPermissions, isSuperAdmin]
  );

  return {
    can,
    hasAny,
    hasAll,
    hasNone,
  };
}

/**
 * Hook pour vérifier une permission spécifique
 */
export function usePermission(permission: Permission, permissions: Permissions, isSuperAdmin: boolean = false): boolean {
  const { can } = usePermissions(permissions, { isSuperAdmin });
  return can(permission);
}

