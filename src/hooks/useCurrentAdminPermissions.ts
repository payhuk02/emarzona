import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EffectivePermissions = Record<string, boolean>;

// Email de l'administrateur principal avec accès complet
const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

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

      // Vérifier si c'est l'administrateur principal
      if (user.email === PRINCIPAL_ADMIN_EMAIL) {
        // Administrateur principal : accès complet
        setRole('admin');
        setIsSuperAdmin(true);
        // Toutes les permissions activées
        setPermissions({
          'users.manage': true,
          'users.roles': true,
          'products.manage': true,
          'orders.manage': true,
          'payments.manage': true,
          'disputes.manage': true,
          'settings.manage': true,
          'emails.manage': true,
          'analytics.view': true,
        });
        setLoading(false);
        return;
      }

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

      setPermissions((roleRow?.permissions as EffectivePermissions) || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback((key: string) => {
    if (isSuperAdmin) return true; // full access
    return Boolean(permissions?.[key]);
  }, [isSuperAdmin, permissions]);

  return { loading, error, role, isSuperAdmin, permissions, can, refresh };
};


