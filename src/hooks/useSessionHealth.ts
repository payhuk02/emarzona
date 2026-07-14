/**
 * Hook pour surveiller la santé des sessions utilisateur
 * Version améliorée avec retry automatique et détection proactive
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  /** true après le premier contrôle auth terminé (évite faux positifs au mount). */
  initialCheckComplete: boolean;
}

export const useSessionHealth = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  const { user, signOut } = useAuth();
  const lastCheckRef = useRef(new Date());
  const [health, setHealth] = useState<SessionHealth>({
    isHealthy: true,
    lastCheck: new Date(),
    timeSinceLastCheck: 0,
    connectionStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'unknown',
    retryCount: 0,
    isRetrying: false,
    gracePeriodActive: false,
    gracePeriodEnds: null,
    initialCheckComplete: false,
  });

  const checkSessionHealth = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setHealth(prev => ({ ...prev, isRetrying: true }));

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        logger.warn('[SessionHealth] check failed', { message: error.message });
        setHealth(prev => ({
          ...prev,
          isHealthy: false,
          lastCheck: new Date(),
          isRetrying: false,
          initialCheckComplete: true,
        }));
        lastCheckRef.current = new Date();
        return false;
      }

      const ok = data.user?.id === user.id;
      lastCheckRef.current = new Date();
      setHealth(prev => ({
        ...prev,
        isHealthy: ok,
        lastCheck: lastCheckRef.current,
        retryCount: ok ? 0 : prev.retryCount + 1,
        isRetrying: false,
        initialCheckComplete: true,
      }));

      if (ok) {
        logger.debug('[SessionHealth] session OK');
      }
      return ok;
    } catch (error) {
      logger.warn('[SessionHealth] check exception', { error });
      lastCheckRef.current = new Date();
      setHealth(prev => ({
        ...prev,
        isHealthy: false,
        isRetrying: false,
        initialCheckComplete: true,
      }));
      return false;
    }
  }, [user]);

  const refreshSessionIfNeeded = useCallback(async () => {
    if (!user) return;

    const healthCheck = await checkSessionHealth();

    if (!healthCheck) {
      try {
        logger.debug('[SessionHealth] attempting refresh');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          logger.warn('[SessionHealth] refresh failed', { message: error.message });
          setHealth(prev => ({ ...prev, isHealthy: false }));

          setTimeout(async () => {
            logger.warn('[SessionHealth] silent sign-out after prolonged failure');
            await signOut();
          }, 600000);

          return;
        }

        if (data.session) {
          logger.debug('[SessionHealth] refresh OK');
          await checkSessionHealth();
        } else {
          logger.warn('[SessionHealth] refresh returned no session');
          await signOut();
        }
      } catch (error) {
        logger.warn('[SessionHealth] refresh exception', { error });
        await signOut();
      }
    }
  }, [user, checkSessionHealth, signOut]);

  useEffect(() => {
    const handleOnline = () => {
      setHealth(prev => ({ ...prev, connectionStatus: 'online' }));
      setTimeout(() => refreshSessionIfNeeded(), 1000);
    };

    const handleOffline = () => {
      setHealth(prev => ({ ...prev, connectionStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshSessionIfNeeded]);

  useEffect(() => {
    if (!enabled || !user) {
      setHealth(prev => ({ ...prev, initialCheckComplete: false, isHealthy: !user }));
      return;
    }

    void checkSessionHealth();

    const healthCheckInterval = setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastCheckRef.current.getTime();
      if (timeSinceLastCheck > 45000) {
        void checkSessionHealth();
      }
    }, 45000);

    return () => clearInterval(healthCheckInterval);
  }, [user, checkSessionHealth, enabled]);

  useEffect(() => {
    if (!enabled || !user) return;

    const handleFocus = () => {
      const timeSinceLastCheck = Date.now() - lastCheckRef.current.getTime();
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        void refreshSessionIfNeeded();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshSessionIfNeeded, enabled]);

  return {
    ...health,
    checkSessionHealth,
    refreshSessionIfNeeded,
  };
};
