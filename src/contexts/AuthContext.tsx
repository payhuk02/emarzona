import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
import { useAdvancedLoyalty } from '@/hooks/useAdvancedLoyalty';
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
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const navigate = useNavigate();
  const { triggerLoyaltyEvent } = useAdvancedLoyalty();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Déclencher l'événement de fidélisation pour la connexion quotidienne
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const today = new Date().toDateString();
            // Vérifier si c'est une nouvelle connexion aujourd'hui
            if (lastLoginDate !== today) {
              const reward = await triggerLoyaltyEvent('daily_login', {
                userId: session.user.id,
              });
              setLastLoginDate(today);
              logger.info("Loyalty points awarded for daily login", { userId: session.user.id, reward });
            }
          } catch (loyaltyError) {
            logger.error("Failed to award loyalty points for daily login", { error: loyaltyError, userId: session.user.id });
          }
        }

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

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      }
    });

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






