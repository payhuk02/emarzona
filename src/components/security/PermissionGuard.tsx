import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { Loader2 } from 'lucide-react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { supabase } from '@/integrations/supabase/client';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';

export type RequiredPermission =
  | 'admin'
  | 'dashboard.view'
  | 'dashboard.edit'
  | 'inventory.view'
  | 'inventory.edit'
  | 'sales.view';

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: RequiredPermission[];
  fallback?: ReactNode;
  requireActiveStore?: boolean;
}

/** Mappe les permissions UI vers les clés RPC `has_store_permission`. */
const STORE_PERMISSION_RPC: Record<Exclude<RequiredPermission, 'admin'>, string> = {
  'dashboard.view': 'analytics.view',
  'dashboard.edit': 'products.manage',
  'inventory.view': 'products.view',
  'inventory.edit': 'products.manage',
  'sales.view': 'orders.view',
};

const STORE_CREATE_REDIRECT = STORE_CREATE_PATH;

async function checkPlatformAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (email && isPrincipalAdminEmail(email)) {
    return true;
  }

  const [{ data: profile }, { data: isAdminRpc }] = await Promise.all([
    supabase.from('profiles').select('role, is_super_admin').eq('user_id', userId).maybeSingle(),
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
  ]);

  if (profile?.is_super_admin) {
    return true;
  }

  return profile?.role === 'admin' || profile?.role === 'super_admin' || isAdminRpc === true;
}

async function checkStorePermissions(
  storeId: string,
  userId: string,
  permissions: Exclude<RequiredPermission, 'admin'>[]
): Promise<boolean> {
  if (permissions.length === 0) {
    return true;
  }

  const results = await Promise.all(
    permissions.map(permission =>
      supabase.rpc('has_store_permission', {
        _store_id: storeId,
        _user_id: userId,
        _permission: STORE_PERMISSION_RPC[permission],
      })
    )
  );

  return results.every(({ data, error }) => !error && data === true);
}

export function PermissionGuard({
  children,
  permissions = [],
  fallback,
  requireActiveStore = true,
}: PermissionGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useStore();

  const needsPermissionCheck = permissions.length > 0;
  const storePermissions = permissions.filter(
    (p): p is Exclude<RequiredPermission, 'admin'> => p !== 'admin'
  );
  const needsAdmin = permissions.includes('admin');

  const { data: hasRequiredPermissions = !needsPermissionCheck, isLoading: permLoading } = useQuery(
    {
      queryKey: ['permission-guard', user?.id, store?.id, permissions],
      queryFn: async () => {
        if (!user) {
          return false;
        }

        if (needsAdmin) {
          const isAdmin = await checkPlatformAdmin(user.id, user.email);
          if (!isAdmin) {
            return false;
          }
        }

        if (storePermissions.length === 0) {
          return true;
        }

        if (!store?.id) {
          return false;
        }

        return checkStorePermissions(store.id, user.id, storePermissions);
      },
      enabled: !!user && needsPermissionCheck && (!requireActiveStore || !!store),
      staleTime: 60_000,
    }
  );

  const loading =
    authLoading || (requireActiveStore && storeLoading) || (needsPermissionCheck && permLoading);

  if (loading) {
    return (
      <AppPageShell>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppPageShell>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireActiveStore && !store) {
    return <Navigate to={STORE_CREATE_REDIRECT} replace />;
  }

  if (!hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AppPageShell>
        <div className="flex flex-col h-[50vh] w-full items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="text-muted-foreground max-w-sm">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </AppPageShell>
    );
  }

  return <>{children}</>;
}
