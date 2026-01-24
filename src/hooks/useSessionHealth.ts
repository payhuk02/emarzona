/**
 * Hook pour surveiller la santé des sessions utilisateur
 * Version améliorée avec retry automatique et détection proactive
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface SessionHealth {
  isHealthy: boolean;
  lastCheck: Date;
  timeSinceLastCheck: number;
  connectionStatus: 'online' | 'offline' | 'unknown';
  retryCount: number;
  isRetrying: boolean;
  gracePeriodActive: boolean;
  gracePeriodEnds: Date | null;
}

export const useSessionHealth = () => {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState<SessionHealth>({
    isHealthy: false,
    lastCheck: new Date(),
    timeSinceLastCheck: 0,
    connectionStatus: navigator.onLine ? 'online' : 'offline',
    retryCount: 0,
    isRetrying: false,
    gracePeriodActive: false,
    gracePeriodEnds: null,
  });

  // Vérifier la santé de la session
  const checkSessionHealth = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setHealth(prev => ({ ...prev, isRetrying: true }));

      // Test simple : récupérer les informations utilisateur
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        logger.error('❌ Session health check failed:', error);
        return false;
      }

      if (data.user?.id === user.id) {
        logger.info('✅ Session healthy');
        setHealth(prev => ({
          ...prev,
          isHealthy: true,
          lastCheck: new Date(),
          retryCount: 0,
          isRetrying: false,
        }));
        return true;
      }

      return false;
    } catch (error) {
      logger.error('💥 Session health check exception:', error);
      return false;
    } finally {
      setHealth(prev => ({ ...prev, isRetrying: false }));
    }
  }, [user]);

  // Rafraîchir la session si nécessaire
  const refreshSessionIfNeeded = useCallback(async () => {
    if (!user) return;

    const healthCheck = await checkSessionHealth();

    if (!healthCheck) {
      // Essayer de rafraîchir la session
      try {
        logger.info('🔄 Attempting session refresh');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          logger.error('❌ Session refresh failed:', error);
          setHealth(prev => ({ ...prev, isHealthy: false }));

          // Si le refresh échoue, déconnecter l'utilisateur
          // ✅ SILENCIEUX: Délai très long (10 minutes) pour éviter les déconnexions surprises
          setTimeout(async () => {
            logger.warn('🔐 Déconnexion silencieuse après long délai');
            await signOut();
          }, 600000); // 10 minutes

          return;
        }

        if (data.session) {
          logger.info('✅ Session refreshed successfully');
          await checkSessionHealth(); // Re-vérifier la santé
        } else {
          // Si le refresh échoue, déconnexion silencieuse
          logger.warn('🔐 Refresh failed, silent sign out');
          await signOut();
        }
      } catch (error) {
        logger.error('💥 Session refresh exception:', error);
        // En cas d'exception, déconnexion silencieuse
        await signOut();
      }
    }
  }, [user, checkSessionHealth, signOut]);

  // Mettre à jour le statut de connexion
  useEffect(() => {
    const handleOnline = () => {
      logger.info('🌐 Connection restored');
      setHealth(prev => ({ ...prev, connectionStatus: 'online' }));
      // Retenter la vérification de santé quand la connexion revient
      setTimeout(() => refreshSessionIfNeeded(), 1000);
    };

    const handleOffline = () => {
      logger.warn('📡 Connection lost');
      setHealth(prev => ({ ...prev, connectionStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshSessionIfNeeded]);

  // ✅ SILENCIEUX: Vérification périodique de santé complètement automatique
  useEffect(() => {
    if (!user) return;

    // Vérifier la santé toutes les 45 secondes (moins fréquent pour éviter la surcharge)
    const healthCheckInterval = setInterval(async () => {
      const now = new Date();
      const timeSinceLastCheck = now.getTime() - health.lastCheck.getTime();

      // Ne pas vérifier trop fréquemment
      if (timeSinceLastCheck > 45000) { // 45 secondes
        await checkSessionHealth();
      }
    }, 45000);

    // Vérification initiale silencieuse
    checkSessionHealth();

    return () => clearInterval(healthCheckInterval);
  }, [user, health.lastCheck, checkSessionHealth]);

  // Vérification au focus de la fenêtre
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      const now = new Date();
      const timeSinceLastCheck = now.getTime() - health.lastCheck.getTime();

      // Si plus de 5 minutes depuis la dernière vérification
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        logger.info('🎯 Window focused, checking session health');
        refreshSessionIfNeeded();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, health.lastCheck, refreshSessionIfNeeded]);

  return {
    ...health,
    checkSessionHealth,
    refreshSessionIfNeeded,
  };
};