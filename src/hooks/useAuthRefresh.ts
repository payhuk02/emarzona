/**
 * Hook pour gérer le rafraîchissement automatique des tokens JWT
 * Gère les erreurs 401/403 et propose une reconnexion automatique
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface UseAuthRefreshOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number; // Minutes avant expiration pour rafraîchir
  maxRetries?: number;
}

export const useAuthRefresh = (options: UseAuthRefreshOptions = {}) => {
  const {
    autoRefresh = true,
    refreshThreshold = 5, // 5 minutes avant expiration
    maxRetries = 3
  } = options;

  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Fonction pour vérifier si le token va expirer bientôt
  const isTokenExpiringSoon = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.expires_at) return false;

      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const thresholdMs = refreshThreshold * 60 * 1000;

      return timeUntilExpiry <= thresholdMs;
    } catch (error) {
      logger.error('Erreur vérification expiration token:', error);
      return false;
    }
  }, [refreshThreshold]);

  // Fonction pour rafraîchir le token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('🔄 Rafraîchissement du token JWT');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('❌ Échec rafraîchissement token:', error);
        return false;
      }

      if (data.session) {
        logger.info('✅ Token rafraîchi avec succès');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('💥 Exception lors du rafraîchissement:', error);
      return false;
    }
  }, []);

  // Fonction pour gérer les erreurs d'authentification
  const handleAuthError = useCallback(async (error: any): Promise<boolean> => {
    // Vérifier si c'est une erreur JWT expiré
    const isJwtExpired = error?.code === 'PGRST303' ||
                        error?.message?.includes('JWT expired') ||
                        error?.message?.includes('401') ||
                        error?.status === 401;

    if (!isJwtExpired) return false;

    logger.warn('⚠️ Token JWT expiré détecté, tentative de rafraîchissement');

    // Essayer de rafraîchir le token
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`🔄 Tentative de rafraîchissement ${attempt}/${maxRetries}`);

      const refreshed = await refreshToken();
      if (refreshed) {
        logger.info('✅ Token rafraîchi, nouvelle tentative de requête');
        return true; // Réessayer la requête originale
      }

      // Attendre avant la prochaine tentative
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Toutes les tentatives ont échoué
    logger.error('❌ Impossible de rafraîchir le token, déconnexion requise');

    toast({
      title: 'Session expirée',
      description: 'Votre session a expiré. Veuillez vous reconnecter.',
      variant: 'destructive',
    });

    // Déconnecter l'utilisateur
    await signOut();

    return false; // Ne pas réessayer
  }, [maxRetries, refreshToken, signOut, toast]);

  // Wrapper pour les requêtes avec gestion automatique des erreurs JWT
  const withAuthRetry = useCallback(async <T>(
    queryFn: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    try {
      return await queryFn();
    } catch (error: any) {
      const shouldRetry = await handleAuthError(error);

      if (shouldRetry) {
        try {
          // Réessayer la requête avec le nouveau token
          logger.info(`🔄 Nouvelle tentative pour ${context || 'requête'}`);
          return await queryFn();
        } catch (retryError) {
          logger.error(`❌ Échec de la nouvelle tentative:`, retryError);
          throw retryError;
        }
      }

      throw error;
    }
  }, [handleAuthError]);

  // Rafraîchissement automatique périodique
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const checkAndRefresh = async () => {
      const shouldRefresh = await isTokenExpiringSoon();
      if (shouldRefresh) {
        logger.info('⏰ Token expire bientôt, rafraîchissement automatique');
        await refreshToken();
      }
    };

    // Vérifier toutes les 2 minutes
    const interval = setInterval(checkAndRefresh, 2 * 60 * 1000);

    // Vérifier au montage
    checkAndRefresh();

    return () => clearInterval(interval);
  }, [autoRefresh, user, isTokenExpiringSoon, refreshToken]);

  // Rafraîchissement au focus de la fenêtre
  useEffect(() => {
    if (!autoRefresh) return;

    const handleFocus = async () => {
      const shouldRefresh = await isTokenExpiringSoon();
      if (shouldRefresh) {
        logger.info('🎯 Focus fenêtre détecté, vérification token');
        await refreshToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [autoRefresh, isTokenExpiringSoon, refreshToken]);

  return {
    withAuthRetry,
    refreshToken,
    isTokenExpiringSoon,
    handleAuthError,
  };
};