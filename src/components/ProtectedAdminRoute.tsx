import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminRoutePermissionGuard } from '@/components/admin/AdminRoutePermissionGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_CHECK_TIMEOUT_MS = 20_000;

/** Fallback auth admin : chrome plausible, pas de spinner plein écran brutal. */
function AdminAuthLoadingFallback() {
  return (
    <div
      className="flex min-h-screen w-full bg-gradient-to-br from-background to-muted/20"
      aria-busy="true"
      aria-live="polite"
      data-testid="admin-auth-loading"
    >
      <div className="hidden md:block w-64 shrink-0 border-r border-border bg-background/80 p-4 space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 shrink-0 border-b border-border px-4 flex items-center md:hidden">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useAuth();
  const { user, loading } = authContext || { user: null, loading: true };
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [timedOut, setTimedOut] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      setTimedOut(false);
      return;
    }
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), ADMIN_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading, isAdminLoading, retryNonce]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    if (!loading && !isAdminLoading && user && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, isAdmin, isAdminLoading, navigate, location.pathname]);

  if (timedOut && (loading || isAdminLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-muted-foreground">
            La vérification des droits administrateur prend plus de temps que prévu.
          </p>
          <Button type="button" variant="outline" onClick={() => setRetryNonce(n => n + 1)}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading || isAdminLoading) {
    return <AdminAuthLoadingFallback />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminRoutePermissionGuard>{children}</AdminRoutePermissionGuard>;
};
