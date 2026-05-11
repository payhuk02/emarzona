/**
 * Module IndexedDB pour la queue locale des actions offline-first
 * Stockage temporaire des actions critiques avec synchronisation automatique
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Types pour les actions locales
export type ActionType =
  | 'create_order'
  | 'update_product'
  | 'add_to_cart'
  | 'update_cart'
  | 'create_store'
  | 'update_store'
  | 'create_user'
  | 'update_user'
  | 'create_review'
  | 'update_inventory'
  | 'process_payment'
  | 'create_shipment'
  | 'update_shipment'
  | 'create_return'
  | 'update_return';

export interface LocalAction {
  id: string;
  action_type: ActionType;
  store_id: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  created_at: string;
  synced: boolean;
  retry_count: number;
  last_error?: string;
  priority: number; // 1 = low, 5 = critical
}

type LocalQueueDB = IDBDatabase;

class LocalQueueManager {
  private db: LocalQueueDB | null = null;
  private readonly DB_NAME = 'emarzona_local_queue';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'pending_actions';
  private readonly MAX_RETRY_COUNT = 5;
  private readonly MAX_QUEUE_SIZE = 1000; // Limite de sécurité

  /**
   * Initialise la base IndexedDB
   */
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        logger.error('Erreur IndexedDB localQueue:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result as LocalQueueDB;
        logger.info('IndexedDB localQueue initialisé avec succès');
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result as LocalQueueDB;
        this.createObjectStore(db);
      };
    });
  }

  /**
   * Crée l'object store
   */
  private createObjectStore(db: LocalQueueDB): void {
    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
      const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });

      // Index pour les requêtes optimisées
      store.createIndex('synced', 'synced', { unique: false });
      store.createIndex('action_type', 'action_type', { unique: false });
      store.createIndex('store_id', 'store_id', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
      store.createIndex('priority', 'priority', { unique: false });
      store.createIndex('idempotency_key', 'idempotency_key', { unique: true });

      logger.info('Object store localQueue créé');
    }
  }

  /**
   * Ajoute une action à la queue locale
   */
  async addAction(
    action_type: ActionType,
    store_id: string,
    payload: Record<string, unknown>,
    priority: number = 3
  ): Promise<string> {
    if (!this.db) {
      await this.initDB();
    }

    // Générer un idempotency key unique
    const idempotency_key = uuidv4();

    const action: LocalAction = {
      id: uuidv4(),
      action_type,
      store_id,
      payload,
      idempotency_key,
      created_at: new Date().toISOString(),
      synced: false,
      retry_count: 0,
      priority,
    };

    // Vérifier la taille de la queue avant d'ajouter
    await this.enforceQueueSizeLimit();

    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.add(action);

      request.onsuccess = () => {
        logger.info(`Action ajoutée à la queue locale: ${action_type}`, { id: action.id });
        resolve(action.id);
      };

      request.onerror = () => {
        logger.error('Erreur ajout action locale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Récupère toutes les actions en attente de synchronisation
   */
  async getPendingActions(limit: number = 50): Promise<LocalAction[]> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false); // synced = false

      request.onsuccess = () => {
        let actions = request.result as LocalAction[];

        // Trier par priorité (desc) puis par date (asc)
        actions.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Priorité descendante
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Date ascendante
        });

        // Limiter le nombre de résultats
        if (limit > 0) {
          actions = actions.slice(0, limit);
        }

        resolve(actions);
      };

      request.onerror = () => {
        logger.error('Erreur récupération actions en attente:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Marque une action comme synchronisée
   */
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result as LocalAction;
        if (action) {
          action.synced = true;
          const updateRequest = store.put(action);

          updateRequest.onsuccess = () => {
            logger.info(`Action marquée comme synchronisée: ${id}`);
            resolve();
          };

          updateRequest.onerror = () => {
            logger.error('Erreur mise à jour action:', updateRequest.error);
            reject(updateRequest.error);
          };
        } else {
          resolve(); // Action déjà supprimée
        }
      };

      getRequest.onerror = () => {
        logger.error('Erreur récupération action pour sync:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Supprime une action de la queue
   */
  async deleteAction(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.info(`Action supprimée de la queue: ${id}`);
        resolve();
      };

      request.onerror = () => {
        logger.error('Erreur suppression action:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Met à jour le compteur de retry et l'erreur d'une action
   */
  async updateRetryInfo(id: string, error?: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result as LocalAction;
        if (action) {
          action.retry_count += 1;
          if (error) {
            action.last_error = error;
          }

          const updateRequest = store.put(action);

          updateRequest.onsuccess = () => {
            logger.info(`Retry info mis à jour pour action: ${id}, count: ${action.retry_count}`);
            resolve();
          };

          updateRequest.onerror = () => {
            logger.error('Erreur mise à jour retry info:', updateRequest.error);
            reject(updateRequest.error);
          };
        } else {
          resolve(); // Action déjà supprimée
        }
      };

      getRequest.onerror = () => {
        logger.error('Erreur récupération action pour retry:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Récupère les actions échouées (à supprimer après un certain temps)
   */
  async getFailedActions(maxRetries: number = this.MAX_RETRY_COUNT): Promise<LocalAction[]> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const actions = request.result as LocalAction[];
        const failedActions = actions.filter(
          action => !action.synced && action.retry_count >= maxRetries
        );
        resolve(failedActions);
      };

      request.onerror = () => {
        logger.error('Erreur récupération actions échouées:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Nettoie les actions échouées trop anciennes
   */
  async cleanupFailedActions(maxAgeHours: number = 24): Promise<number> {
    const failedActions = await this.getFailedActions();
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    let cleanedCount = 0;
    for (const action of failedActions) {
      if (new Date(action.created_at) < cutoffTime) {
        await this.deleteAction(action.id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`${cleanedCount} actions échouées nettoyées`);
    }

    return cleanedCount;
  }

  /**
   * Récupère les statistiques de la queue
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
    byType: Record<string, number>;
    byStore: Record<string, number>;
  }> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const actions = request.result as LocalAction[];

        const stats = {
          total: actions.length,
          pending: actions.filter(a => !a.synced).length,
          synced: actions.filter(a => a.synced).length,
          failed: actions.filter(a => !a.synced && a.retry_count >= this.MAX_RETRY_COUNT).length,
          byType: {} as Record<string, number>,
          byStore: {} as Record<string, number>,
        };

        // Statistiques par type
        actions.forEach(action => {
          stats.byType[action.action_type] = (stats.byType[action.action_type] || 0) + 1;
          stats.byStore[action.store_id] = (stats.byStore[action.store_id] || 0) + 1;
        });

        resolve(stats);
      };

      request.onerror = () => {
        logger.error('Erreur récupération stats queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Force la limite de taille de la queue
   */
  private async enforceQueueSizeLimit(): Promise<void> {
    const stats = await this.getQueueStats();

    if (stats.total >= this.MAX_QUEUE_SIZE) {
      // Supprimer les actions les plus anciennes synchronisées
      const syncedActions = await this.getSyncedActions(50); // Supprimer par lots de 50
      for (const action of syncedActions) {
        await this.deleteAction(action.id);
      }

      logger.warn(
        `Queue size limit atteint, ${syncedActions.length} actions synchronisées supprimées`
      );
    }
  }

  /**
   * Récupère les actions synchronisées (pour nettoyage)
   */
  private async getSyncedActions(limit: number = 100): Promise<LocalAction[]> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(true); // synced = true

      request.onsuccess = () => {
        let actions = request.result as LocalAction[];

        // Trier par date (plus anciennes d'abord)
        actions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Limiter le nombre de résultats
        if (limit > 0) {
          actions = actions.slice(0, limit);
        }

        resolve(actions);
      };

      request.onerror = () => {
        logger.error('Erreur récupération actions synchronisées:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Vide complètement la queue (fonction d'urgence)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        logger.warn('Queue locale complètement vidée');
        resolve();
      };

      request.onerror = () => {
        logger.error('Erreur vidage queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Exporte la queue pour debug
   */
  async exportQueue(): Promise<LocalAction[]> {
    if (!this.db) {
      await this.initDB();
    }

    const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as LocalAction[]);
      };

      request.onerror = () => {
        logger.error('Erreur export queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instance globale du gestionnaire de queue locale
export const localQueue = new LocalQueueManager();

// Initialisation automatique
if (typeof window !== 'undefined') {
  // Initialiser au chargement de la page
  window.addEventListener('load', () => {
    localQueue.initDB().catch(error => {
      logger.error('Erreur initialisation localQueue:', error);
    });
  });

  // Cleanup automatique
  window.addEventListener('beforeunload', () => {
    localQueue.destroy();
  });
}
