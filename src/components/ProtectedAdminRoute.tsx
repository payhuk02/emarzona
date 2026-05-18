import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';

export const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const { user, loading } = authContext || { user: null, loading: true };
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!loading && !isAdminLoading && user && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, loading, isAdmin, isAdminLoading, navigate]);

  if (loading || isAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Verification des droits administrateur...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};
