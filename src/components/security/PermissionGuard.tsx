import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { Loader2 } from 'lucide-react';
import { AppPageShell } from '@/components/layout/AppPageShell';

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

export function PermissionGuard({
  children,
  permissions = [],
  fallback,
  requireActiveStore = true,
}: PermissionGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useStore();

  const loading = authLoading || (requireActiveStore && storeLoading);

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
    // If a store is required but user doesn't have one, redirect to onboarding or generic fallback
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  // TODO: Actual permission check against user roles/permissions
  // For now, if the user is authenticated and store exists, we grant access.
  // In a real Enterprise app, we would verify `permissions.every(p => user.permissions.includes(p))`
  const hasRequiredPermissions = true;

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
