/**
 * Service de synchronisation offline-first
 * Gère la synchronisation automatique des actions locales vers le backend
 */

import { localQueue, LocalAction } from '@/lib/localQueue';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ actionId: string; error: string }>;
  duration: number;
}

interface SyncActionPayload {
  id: string;
  action_type: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  store_id: string;
}

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 secondes
  private readonly MAX_RETRY_DELAY = 300000; // 5 minutes
  private readonly BASE_RETRY_DELAY = 1000; // 1 seconde

  constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  /**
   * Configure les écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Écouteur de connectivité
    window.addEventListener('online', () => {
      logger.info('Connexion rétablie, démarrage sync automatique');
      this.isOnline = true;
      this.syncOnReconnect();
    });

    window.addEventListener('offline', () => {
      logger.warn('Connexion perdue');
      this.isOnline = false;
    });

    // Écouteur de visibilité (reprise d'activité)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncLocalQueue().catch(error => {
          logger.error('Erreur sync après reprise visibilité:', error);
        });
      }
    });
  }

  /**
   * Démarre la synchronisation périodique
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncLocalQueue().catch(error => {
          logger.error('Erreur sync périodique:', error);
        });
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Synchronise la queue locale vers le backend
   */
  async syncLocalQueue(): Promise<SyncResult> {
    if (this.syncInProgress) {
      logger.info('Sync déjà en cours, ignoré');
      return { success: true, synced: 0, failed: 0, errors: [], duration: 0 };
    }

    if (!this.isOnline) {
      logger.info('Hors ligne, sync ignoré');
      return { success: false, synced: 0, failed: 0, errors: [], duration: 0 };
    }

    const startTime = Date.now();
    this.syncInProgress = true;

    try {
      // Récupérer les actions en attente
      const pendingActions = await localQueue.getPendingActions(20); // Limiter à 20 actions par batch

      if (pendingActions.length === 0) {
        return { success: true, synced: 0, failed: 0, errors: [], duration: Date.now() - startTime };
      }

      logger.info(`Synchronisation de ${pendingActions.length} actions`);

      // Préparer le payload pour le backend
      const syncPayload: SyncActionPayload[] = pendingActions.map(action => ({
        id: action.id,
        action_type: action.action_type,
        payload: action.payload,
        idempotency_key: action.idempotency_key,
        store_id: action.store_id
      }));

      // Envoyer au backend
      const response = await this.sendToBackend(syncPayload);

      // Traiter la réponse
      const { synced, failed, errors } = await this.processBackendResponse(pendingActions, response);

      const result: SyncResult = {
        success: failed === 0,
        synced,
        failed,
        errors,
        duration: Date.now() - startTime
      };

      logger.info(`Sync terminé: ${synced} réussis, ${failed} échoués`);

      // Nettoyer les actions échouées trop anciennes
      await localQueue.cleanupFailedActions();

      return result;

    } catch (error) {
      logger.error('Erreur sync queue locale:', error);

      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [{ actionId: 'global', error: error.message }],
        duration: Date.now() - startTime
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Envoie les actions au backend
   */
  private async sendToBackend(actions: SyncActionPayload[]): Promise<any> {
    const response = await fetch('/api/sync/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Le JWT sera automatiquement ajouté par un interceptor ou le contexte auth
      },
      body: JSON.stringify({ actions }),
      credentials: 'include' // Pour envoyer les cookies si nécessaire
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Traite la réponse du backend
   */
  private async processBackendResponse(
    localActions: LocalAction[],
    backendResponse: any
  ): Promise<{ synced: number; failed: number; errors: Array<{ actionId: string; error: string }> }> {

    let synced = 0;
    let failed = 0;
    const errors: Array<{ actionId: string; error: string }> = [];

    // Créer une map pour retrouver les actions locales
    const actionMap = new Map(localActions.map(action => [action.id, action]));

    // Traiter chaque résultat
    for (const result of backendResponse.results || []) {
      const localAction = actionMap.get(result.id);

      if (!localAction) {
        logger.warn(`Action inconnue dans réponse backend: ${result.id}`);
        continue;
      }

      if (result.success) {
        // Action synchronisée avec succès
        await localQueue.markAsSynced(result.id);
        synced++;
        logger.info(`Action synchronisée: ${localAction.action_type} (${result.id})`);
      } else {
        // Échec de synchronisation
        await localQueue.updateRetryInfo(result.id, result.error);
        failed++;
        errors.push({ actionId: result.id, error: result.error });

        logger.warn(`Échec sync action ${result.id}: ${result.error}`);
      }
    }

    return { synced, failed, errors };
  }

  /**
   * Retry les actions échouées
   */
  async retryFailedActions(): Promise<SyncResult> {
    try {
      // Récupérer les actions avec des erreurs récentes
      const failedActions = await localQueue.getFailedActions(3); // retry_count >= 3

      if (failedActions.length === 0) {
        return { success: true, synced: 0, failed: 0, errors: [], duration: 0 };
      }

      logger.info(`Retry de ${failedActions.length} actions échouées`);

      // Remettre les compteurs à zéro pour permettre un retry
      for (const action of failedActions) {
        await localQueue.updateRetryInfo(action.id, undefined); // Reset error
      }

      // Relancer la synchronisation
      return await this.syncLocalQueue();

    } catch (error) {
      logger.error('Erreur retry actions échouées:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [{ actionId: 'retry', error: error.message }],
        duration: 0
      };
    }
  }

  /**
   * Synchronisation forcée lors de la reconnexion
   */
  private syncOnReconnect(): void {
    // Annuler le timeout existant
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Délai avant sync pour éviter les appels répétés
    this.reconnectTimeout = setTimeout(() => {
      this.syncLocalQueue().catch(error => {
        logger.error('Erreur sync après reconnexion:', error);
      });
    }, 2000); // 2 secondes après reconnexion
  }

  /**
   * Force la synchronisation manuellement
   */
  async forceSync(): Promise<SyncResult> {
    logger.info('Synchronisation forcée demandée');
    return await this.syncLocalQueue();
  }

  /**
   * Vérifie l'état de synchronisation
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    pendingActions: number;
    lastSyncAttempt: string | null;
    queueStats: any;
  }> {
    const queueStats = await localQueue.getQueueStats();

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingActions: queueStats.pending,
      lastSyncAttempt: null, // TODO: stocker la dernière tentative
      queueStats
    };
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Hook React pour utiliser le service de sync
export const useSyncService = () => {
  const forceSync = async () => {
    return await syncService.forceSync();
  };

  const retryFailed = async () => {
    return await syncService.retryFailedActions();
  };

  const getStatus = async () => {
    return await syncService.getSyncStatus();
  };

  return {
    forceSync,
    retryFailed,
    getStatus,
    isOnline: navigator.onLine
  };
};

// Instance globale du service
export const syncService = new SyncService();

// Cleanup automatique
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncService.destroy();
  });
}