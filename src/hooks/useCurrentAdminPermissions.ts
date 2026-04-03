import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EffectivePermissions = Record<string, boolean>;

// Toutes les permissions disponibles
const ALL_PERMISSIONS: EffectivePermissions = {
  'users.manage': true,
  'users.roles': true,
  'products.manage': true,
  'orders.manage': true,
  'payments.manage': true,
  'disputes.manage': true,
  'settings.manage': true,
  'emails.manage': true,
  'analytics.view': true,
};

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

      // Vérifier le rôle admin via user_roles (fonction sécurisée has_role)
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (isAdmin) {
        setRole('admin');
        setIsSuperAdmin(true);
        setPermissions(ALL_PERMISSIONS);
        setLoading(false);
        return;
      }

      // Vérifier le rôle moderator
      const { data: isModerator } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'moderator',
      });

      if (isModerator) {
        setRole('moderator');
        setIsSuperAdmin(false);
        setPermissions({
          'products.manage': true,
          'orders.manage': true,
          'disputes.manage': true,
          'analytics.view': true,
        });
        setLoading(false);
        return;
      }

      // Utilisateur standard
      setRole('user');
      setIsSuperAdmin(false);
      setPermissions({});
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
    if (isSuperAdmin) return true;
    return Boolean(permissions?.[key]);
  }, [isSuperAdmin, permissions]);

  return { loading, error, role, isSuperAdmin, permissions, can, refresh };
};
