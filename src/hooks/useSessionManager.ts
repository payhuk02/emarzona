/**
 * Hook pour gérer la session utilisateur et éviter les erreurs JWT
 * Surveille l'état de la session et propose des actions préventives
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface SessionState {
  isValid: boolean;
  expiresAt: Date | null;
  timeUntilExpiry: number | null;
  isExpiringSoon: boolean;
  lastActivity: Date;
}

export const useSessionManager = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isExpiringSoon: false,
    lastActivity: new Date()
  });

  // Vérifier l'état de la session
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Erreur lors de la vérification de session:', error);
        setSessionState(prev => ({ ...prev, isValid: false }));
        return;
      }

      if (!session) {
        setSessionState(prev => ({ ...prev, isValid: false, expiresAt: null, timeUntilExpiry: null, isExpiringSoon: false }));
        return;
      }

      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const isExpiringSoon = timeUntilExpiry <= (5 * 60 * 1000); // 5 minutes

      setSessionState({
        isValid: true,
        expiresAt,
        timeUntilExpiry,
        isExpiringSoon,
        lastActivity: new Date()
      });

      logger.info('🔍 Session vérifiée:', {
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60), // minutes
        isExpiringSoon
      });

    } catch (error) {
      logger.error('Exception lors de la vérification de session:', error);
      setSessionState(prev => ({ ...prev, isValid: false }));
    }
  }, []);

  // Rafraîchir le token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('🔄 Rafraîchissement de session demandé');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('Échec du rafraîchissement de session:', error);
        return false;
      }

      if (data.session) {
        logger.info('✅ Session rafraîchie avec succès');
        await checkSession(); // Mettre à jour l'état
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Exception lors du rafraîchissement:', error);
      return false;
    }
  }, [checkSession]);

  // Forcer la reconnexion
  const forceReconnect = useCallback(async () => {
    logger.warn('🔐 Forçage de reconnexion suite à session expirée');

    // ✅ SILENCIEUX: Redirection automatique sans message visible
    // L'utilisateur sera automatiquement redirigé vers la page de connexion
    setTimeout(async () => {
      try {
        await signOut();
      } catch (error) {
        logger.error('Erreur lors de la déconnexion forcée:', error);
      }
    }, 500); // Délai plus court
  }, [signOut, toast]);

  // Rafraîchissement automatique
  useEffect(() => {
    if (!user) return;

    // Vérifier la session immédiatement
    checkSession();

    // Rafraîchir automatiquement si expiration proche
    const autoRefresh = async () => {
      if (sessionState.isExpiringSoon && sessionState.isValid) {
        logger.info('⏰ Rafraîchissement automatique de session');
        const success = await refreshSession();
        if (!success) {
          await forceReconnect();
        }
      }
    };

    // Vérifier toutes les minutes
    const interval = setInterval(() => {
      autoRefresh();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, sessionState.isExpiringSoon, sessionState.isValid, checkSession, refreshSession, forceReconnect]);

  // Rafraîchissement au focus de la fenêtre
  useEffect(() => {
    if (!user) return;

    const handleFocus = async () => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - sessionState.lastActivity.getTime();

      // Si plus de 10 minutes d'inactivité, vérifier la session
      if (timeSinceLastActivity > 10 * 60 * 1000) {
        logger.info('🎯 Retour sur l\'app, vérification de session');
        await checkSession();

        if (!sessionState.isValid) {
          await forceReconnect();
        } else if (sessionState.isExpiringSoon) {
          await refreshSession();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, sessionState.lastActivity, sessionState.isValid, sessionState.isExpiringSoon, checkSession, refreshSession, forceReconnect]);

  // Gestion des erreurs de requête
  const handleRequestError = useCallback(async (error: Error | unknown): Promise<boolean> => {
    // Détecter les erreurs JWT
    const errorObj = error as Error;
    const isJwtError = errorObj?.message?.includes('JWT expired') ||
                      errorObj?.message?.includes('401') ||
                      (errorObj as any)?.code === 'PGRST303' ||
                      (errorObj as any)?.status === 401;

    if (isJwtError) {
      logger.warn('🔐 Erreur JWT détectée, tentative de récupération');

      // Essayer de rafraîchir la session
      const refreshed = await refreshSession();
      if (refreshed) {
        logger.info('✅ Session rafraîchie, requête peut être retentée');
        return true; // Réessayer la requête
      } else {
        // Échec du rafraîchissement, forcer la reconnexion
        await forceReconnect();
        return false;
      }
    }

    return false; // Pas une erreur JWT, laisser le caller gérer
  }, [refreshSession, forceReconnect]);

  return {
    sessionState,
    checkSession,
    refreshSession,
    forceReconnect,
    handleRequestError,
    isAuthenticated: !!user && sessionState.isValid
  };
};