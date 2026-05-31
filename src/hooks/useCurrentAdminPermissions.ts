import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';
import { logger } from '@/lib/logger';
import {
  fallbackPermissionsForRole,
  normalizeRolePermissions,
  resolvePlatformRole,
  type EffectivePermissions,
  type PlatformRoleName,
} from '@/lib/admin/admin-permissions';

const PERMISSIONS_LOAD_TIMEOUT_MS = 12_000;

export type { EffectivePermissions } from '@/lib/admin/admin-permissions';

export const useCurrentAdminPermissions = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');
  const [platformRole, setPlatformRole] = useState<PlatformRoleName | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<EffectivePermissions>({});
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      if (requestIdRef.current !== requestId) return;
      logger.warn('useCurrentAdminPermissions: timeout');
      setError('permissions_timeout');
      setLoading(false);
    }, PERMISSIONS_LOAD_TIMEOUT_MS);

    try {
      const user = authUser;
      if (!user) throw new Error('Not authenticated');

      const principalAdmin = isPrincipalAdminEmail(user.email);

      if (principalAdmin) {
        setPlatformRole('super_admin');
        setRole('super_admin');
        setIsSuperAdmin(true);
        setPermissions(fallbackPermissionsForRole('super_admin'));
        return;
      }

      const [{ data: profile }, { data: isAdminRpc }] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, is_super_admin')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
      ]);

      const profileRole = profile?.role ?? null;
      const isStaffLike = profileRole === 'staff' || profileRole === 'moderator';

      const resolved = resolvePlatformRole({
        isSuperAdmin: principalAdmin || Boolean(profile?.is_super_admin),
        profileRole,
        hasAdminRole: Boolean(isAdminRpc),
        hasModeratorRole: isStaffLike,
      });

      if (!resolved) {
        setRole('user');
        setPlatformRole(null);
        setIsSuperAdmin(false);
        setPermissions({});
        return;
      }

      setPlatformRole(resolved);
      setRole(resolved);
      setIsSuperAdmin(resolved === 'super_admin');

      const { data: roleRow, error: roleError } = await supabase
        .from('platform_roles')
        .select('permissions')
        .eq('role', resolved)
        .maybeSingle();

      if (roleError) {
        setPermissions(fallbackPermissionsForRole(resolved));
        return;
      }

      const fromDb = normalizeRolePermissions(roleRow?.permissions);
      const hasAny = Object.values(fromDb).some(Boolean);
      setPermissions(hasAny ? fromDb : fallbackPermissionsForRole(resolved));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setRole('user');
      setPlatformRole(null);
      setIsSuperAdmin(false);
      setPermissions({});
    } finally {
      window.clearTimeout(timeoutId);
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading) {
      refresh();
    }
  }, [authLoading, refresh]);

  const can = useCallback(
    (key: string) => {
      if (isSuperAdmin) return true;
      return Boolean(permissions?.[key]);
    },
    [isSuperAdmin, permissions]
  );

  return { loading, error, role, platformRole, isSuperAdmin, permissions, can, refresh };
};
