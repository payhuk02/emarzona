import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Mettre à jour l'utilisateur dans Sentry
        if (session?.user) {
          setSentryUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username,
          });
        } else {
          clearSentryUser();
        }
      }
    );

    // THEN check for existing session (avec retry automatique)
    const checkExistingSession = async (retryCount = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Erreur récupération session existante:', error);
          if (retryCount < 2 && (error.message?.includes('network') || error.message?.includes('fetch'))) {
            setTimeout(() => checkExistingSession(retryCount + 1), 1000);
            return;
          }
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setSentryUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username,
          });
        }
      } catch (error) {
        logger.error('Exception lors de la vérification de session:', error);
        if (retryCount < 2) {
          setTimeout(() => checkExistingSession(retryCount + 1), 1000);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    clearSentryUser();
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};






