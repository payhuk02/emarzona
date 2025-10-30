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

  const DEFAULT_ROLES: Array<{ role: string; permissions: RolePermissions }> = [
    {
      role: 'admin',
      permissions: Object.fromEntries(DEFAULT_PERMISSION_KEYS.map((k) => [k, true])) as RolePermissions,
    },
    {
      role: 'manager',
      permissions: {
        'users.manage': false,
        'users.roles': false,
        'products.manage': true,
        'orders.manage': true,
        'payments.manage': true,
        'disputes.manage': true,
        'settings.manage': false,
        'emails.manage': true,
        'analytics.view': true,
      },
    },
    {
      role: 'moderator',
      permissions: {
        'users.manage': false,
        'users.roles': false,
        'products.manage': true,
        'orders.manage': true,
        'payments.manage': false,
        'disputes.manage': true,
        'settings.manage': false,
        'emails.manage': false,
        'analytics.view': true,
      },
    },
    {
      role: 'support',
      permissions: {
        'users.manage': false,
        'users.roles': false,
        'products.manage': false,
        'orders.manage': true,
        'payments.manage': false,
        'disputes.manage': true,
        'settings.manage': false,
        'emails.manage': false,
        'analytics.view': true,
      },
    },
    {
      role: 'viewer',
      permissions: {
        'users.manage': false,
        'users.roles': false,
        'products.manage': false,
        'orders.manage': false,
        'payments.manage': false,
        'disputes.manage': false,
        'settings.manage': false,
        'emails.manage': false,
        'analytics.view': true,
      },
    },
  ];

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
      // Fallback: table absente en production → utiliser des rôles par défaut côté client
      setRoles(DEFAULT_ROLES);
      toast({ title: 'RBAC non initialisé', description: 'Utilisation des rôles par défaut côté client. Veuillez exécuter la migration platform_roles.', variant: 'destructive' });
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


