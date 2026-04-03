/**
 * Hook pour gérer le mode offline et la détection d'erreurs backend
 * Bascule automatiquement vers le stockage local en cas de problème
 */

import { useState, useEffect, useCallback } from 'react';
import { localQueue, ActionType } from '@/lib/localQueue';
import { syncService } from '@/services/syncService';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface OfflineModeState {
  isOffline: boolean;
  isBackendDown: boolean;
  pendingActions: number;
  lastSyncTime: string | null;
  connectionStatus: 'online' | 'offline' | 'backend_down' | 'syncing';
}

interface UseOfflineModeOptions {
  autoRetry?: boolean;
  retryInterval?: number;
  showToasts?: boolean;
}

export const useOfflineMode = (options: UseOfflineModeOptions = {}) => {
  const {
    autoRetry = true,
    retryInterval = 30000, // 30 secondes
    showToasts = true,
  } = options;

  const { toast } = useToast();

  const [state, setState] = useState<OfflineModeState>({
    isOffline: !navigator.onLine,
    isBackendDown: false,
    pendingActions: 0,
    lastSyncTime: null,
    connectionStatus: navigator.onLine ? 'online' : 'offline',
  });

  // Met à jour les statistiques de queue
  const updateQueueStats = useCallback(async () => {
    try {
      const stats = await localQueue.getQueueStats();
      setState(prev => ({
        ...prev,
        pendingActions: stats.pending,
      }));
    } catch (error) {
      logger.error('Erreur récupération stats queue:', error);
    }
  }, []);

  // Vérifie la connectivité backend
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      // Test rapide avec un endpoint léger
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      return response.ok;
    } catch (error) {
      logger.warn('Backend health check failed:', error);
      return false;
    }
  }, []);

  // Met à jour l'état de connectivité
  const updateConnectionStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    const backendUp = isOnline ? await checkBackendHealth() : false;

    const newStatus: OfflineModeState['connectionStatus'] = !isOnline
      ? 'offline'
      : !backendUp
        ? 'backend_down'
        : 'online';

    setState(prev => ({
      ...prev,
      isOffline: !isOnline,
      isBackendDown: !backendUp,
      connectionStatus: newStatus,
    }));

    // Si on revient en ligne, déclencher une sync
    if (isOnline && backendUp && (prev.isOffline || prev.isBackendDown)) {
      setState(prev => ({ ...prev, connectionStatus: 'syncing' }));

      try {
        const result = await syncService.forceSync();

        if (showToasts) {
          if (result.success) {
            toast({
              title: 'Synchronisation réussie',
              description: `${result.synced} actions synchronisées`,
            });
          } else {
            toast({
              title: 'Synchronisation partielle',
              description: `${result.synced} réussis, ${result.failed} échoués`,
              variant: 'destructive',
            });
          }
        }

        setState(prev => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          connectionStatus: 'online',
        }));
      } catch (error) {
        logger.error('Erreur sync automatique:', error);
        setState(prev => ({ ...prev, connectionStatus: 'backend_down' }));
      }
    }
  }, [checkBackendHealth, showToasts, toast]);

  // Fonction principale pour exécuter une action
  const executeAction = useCallback(
    async <T>(
      actionType: ActionType,
      storeId: string,
      payload: Record<string, unknown>,
      onlineAction: () => Promise<T>,
      options: {
        priority?: number;
        fallbackValue?: T;
        skipOfflineQueue?: boolean;
      } = {}
    ): Promise<T | null> => {
      const { priority = 3, fallbackValue = null, skipOfflineQueue = false } = options;

      // Essayer d'abord en ligne
      if (state.connectionStatus === 'online') {
        try {
          const result = await onlineAction();
          return result;
        } catch (error) {
          logger.warn(`Action ${actionType} échouée en ligne, basculement offline:`, error);

          // Marquer le backend comme down
          setState(prev => ({
            ...prev,
            isBackendDown: true,
            connectionStatus: 'backend_down',
          }));

          // Si on ne doit pas utiliser la queue offline, retourner la valeur de fallback
          if (skipOfflineQueue) {
            if (showToasts) {
              toast({
                title: 'Action temporairement indisponible',
                description: 'Veuillez réessayer dans quelques instants',
                variant: 'destructive',
              });
            }
            return fallbackValue;
          }
        }
      }

      // Mode offline - ajouter à la queue locale
      try {
        await localQueue.addAction(actionType, storeId, payload, priority);

        if (showToasts) {
          toast({
            title: 'Action enregistrée',
            description: 'Elle sera synchronisée automatiquement dès que possible',
          });
        }

        // Mettre à jour les stats
        await updateQueueStats();

        return fallbackValue;
      } catch (error) {
        logger.error(`Erreur ajout action offline ${actionType}:`, error);

        if (showToasts) {
          toast({
            title: 'Erreur',
            description: "Impossible d'enregistrer l'action",
            variant: 'destructive',
          });
        }

        return fallbackValue;
      }
    },
    [state.connectionStatus, showToasts, toast, updateQueueStats]
  );

  // Force la synchronisation
  const forceSync = useCallback(async () => {
    if (state.connectionStatus === 'offline') {
      if (showToasts) {
        toast({
          title: 'Hors ligne',
          description: 'Veuillez vérifier votre connexion internet',
          variant: 'destructive',
        });
      }
      return;
    }

    setState(prev => ({ ...prev, connectionStatus: 'syncing' }));

    try {
      const result = await syncService.forceSync();

      if (showToasts) {
        if (result.success) {
          toast({
            title: 'Synchronisation réussie',
            description: `${result.synced} actions synchronisées`,
          });
        } else {
          toast({
            title: 'Synchronisation partielle',
            description: `${result.synced} réussis, ${result.failed} échoués`,
            variant: 'destructive',
          });
        }
      }

      setState(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        connectionStatus: result.success ? 'online' : 'backend_down',
      }));

      await updateQueueStats();
    } catch (error) {
      logger.error('Erreur sync forcé:', error);
      setState(prev => ({ ...prev, connectionStatus: 'backend_down' }));

      if (showToasts) {
        toast({
          title: 'Erreur de synchronisation',
          description: 'Veuillez réessayer plus tard',
          variant: 'destructive',
        });
      }
    }
  }, [state.connectionStatus, showToasts, toast, updateQueueStats]);

  // Retry les actions échouées
  const retryFailed = useCallback(async () => {
    if (state.connectionStatus !== 'online') {
      return;
    }

    try {
      const result = await syncService.retryFailedActions();

      if (showToasts && result.failed > 0) {
        toast({
          title: 'Retry terminé',
          description: `${result.synced} actions retentées avec succès`,
        });
      }

      await updateQueueStats();
    } catch (error) {
      logger.error('Erreur retry:', error);

      if (showToasts) {
        toast({
          title: 'Erreur retry',
          description: 'Impossible de retenter les actions',
          variant: 'destructive',
        });
      }
    }
  }, [state.connectionStatus, showToasts, toast, updateQueueStats]);

  // Écouteurs d'événements
  useEffect(() => {
    const handleOnline = () => updateConnectionStatus();
    const handleOffline = () => updateConnectionStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérification périodique de la santé du backend
    let healthCheckInterval: NodeJS.Timeout;
    if (autoRetry) {
      healthCheckInterval = setInterval(() => {
        updateConnectionStatus();
      }, retryInterval);
    }

    // Mise à jour initiale
    updateConnectionStatus();
    updateQueueStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, [autoRetry, retryInterval, updateConnectionStatus, updateQueueStats]);

  return {
    // État
    ...state,

    // Actions
    executeAction,
    forceSync,
    retryFailed,
    updateQueueStats,

    // Utilitaires
    isActionable: state.connectionStatus === 'online',
    hasPendingActions: state.pendingActions > 0,
    canRetry: state.connectionStatus === 'online' && state.pendingActions > 0,
  };
};
