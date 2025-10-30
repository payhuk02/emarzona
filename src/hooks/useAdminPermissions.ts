import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RolePermissions = Record<string, boolean>;

export const DEFAULT_PERMISSION_KEYS: string[] = [
  'users.manage',
  'users.roles',
  'products.manage',
  'orders.manage',
  'payments.manage',
  'disputes.manage',
  'settings.manage',
  'emails.manage',
  'analytics.view',
];

export const useAdminPermissions = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Array<{ role: string; permissions: RolePermissions }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('platform_roles')
        .select('role, permissions')
        .order('role');
      if (error) throw error;
      setRoles((data || []) as any);
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const updateRolePermissions = useCallback(async (role: string, permissions: RolePermissions) => {
    try {
      const { error } = await supabase
        .from('platform_roles')
        .update({ permissions })
        .eq('role', role);
      if (error) throw error;
      toast({ title: 'Permissions enregistrées', description: role });
      await fetchRoles();
      return true;
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
      return false;
    }
  }, [fetchRoles, toast]);

  return { roles, loading, error, refresh: fetchRoles, updateRolePermissions };
};


