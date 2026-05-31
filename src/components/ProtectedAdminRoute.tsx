import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { AdminRoutePermissionGuard } from '@/components/admin/AdminRoutePermissionGuard';
import { Button } from '@/components/ui/button';

const ADMIN_CHECK_TIMEOUT_MS = 20_000;

export const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useAuth();
  const { user, loading } = authContext || { user: null, loading: true };
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), ADMIN_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading, isAdminLoading]);

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
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading || isAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Vérification des droits administrateur...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminRoutePermissionGuard>{children}</AdminRoutePermissionGuard>;
};
