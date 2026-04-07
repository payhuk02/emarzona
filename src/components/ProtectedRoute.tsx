import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  // Appel de useAuth avec gestion d'erreur
  // Si useAuth échoue (contexte non disponible), il retournera les valeurs par défaut
  const authContext = useAuth();
  const { user, loading } = authContext || { user: null, loading: true };

  useEffect(() => {
    // Si pas d'utilisateur après le chargement, rediriger vers l'authentification
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (la redirection est en cours)
  if (!user) {
    return null;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};






