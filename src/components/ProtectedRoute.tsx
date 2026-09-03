import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

/** Fallback auth : chrome plausible selon la zone, sans spinner plein écran brutal. */
function AuthLoadingFallback() {
  const { pathname } = useLocation();
  const isAppShell =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account');

  if (isAppShell) {
    return (
      <div className="flex min-h-screen w-full bg-background" aria-busy="true" aria-live="polite">
        <div className="hidden md:block w-14 shrink-0 border-r border-border bg-muted/30" />
        <div className="flex min-w-0 flex-1 flex-col p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-sm space-y-3 p-6">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Appel de useAuth avec gestion d'erreur
  // Si useAuth échoue (contexte non disponible), il retournera les valeurs par défaut
  const authContext = useAuth();
  const { user, loading } = authContext || { user: null, loading: true };

  useEffect(() => {
    // Si pas d'utilisateur après le chargement, rediriger vers l'authentification
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname + location.search } });
    }
    // Important: pathname/search (pas l'objet location) — sinon re-renders infinis.
  }, [user, loading, navigate, location.pathname, location.search]);

  if (loading) {
    return <AuthLoadingFallback />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
