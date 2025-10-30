import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EffectivePermissions = Record<string, boolean>;

export const useCurrentAdminPermissions = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('user');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<EffectivePermissions>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('role, is_super_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      if (pErr) throw pErr;

      const currentRole = profile?.role || 'user';
      setRole(currentRole);
      setIsSuperAdmin(Boolean(profile?.is_super_admin));

      const { data: roleRow, error: rErr } = await supabase
        .from('platform_roles')
        .select('permissions')
        .eq('role', currentRole)
        .maybeSingle();
      if (rErr) throw rErr;

      setPermissions((roleRow?.permissions as any) || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback((key: string) => {
    if (isSuperAdmin) return true; // full access
    return Boolean((permissions as any)?.[key]);
  }, [isSuperAdmin, permissions]);

  return { loading, error, role, isSuperAdmin, permissions, can, refresh };
};


