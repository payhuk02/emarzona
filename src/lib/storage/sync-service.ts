/**
 * Service de synchronisation intelligent pour Emarzona
 * Gestion avancée de la synchronisation avec résolution de conflits
 * et stratégies adaptatives selon la connectivité
 */

import { hybridStorage, StorageItem } from './hybrid-storage-service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { backupService } from './backup-service';

export interface SyncConfig {
  enabled: boolean;
  mode: 'realtime' | 'batch' | 'manual';
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictStrategy: 'last_wins' | 'manual' | 'merge';
  priorityCollections: string[];
  syncWhenOffline: boolean;
  adaptiveSync: boolean;
}

export interface SyncResult {
  collection: string;
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

export interface ConflictResolution {
  id: string;
  collection: string;
  local: StorageItem;
  remote: StorageItem;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolved: boolean;
  timestamp: string;
}

export interface SyncQueueItem {
  id: string;
  collection: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: number;
  timestamp: string;
  retryCount: number;
}

export class SyncService {
  private config: SyncConfig = {
    enabled: true,
    mode: 'batch',
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 1000,
    conflictStrategy: 'last_wins',
    priorityCollections: ['admin_config', 'user_sessions', 'critical_data'],
    syncWhenOffline: false,
    adaptiveSync: true
  };

  private syncInProgress = new Map<string, boolean>();
  private realtimeSubscription: any = null;
  private batchInterval: NodeJS.Timeout | null = null;
  private queueProcessor: NodeJS.Timeout | null = null;
  private connectivityMonitor: NodeJS.Timeout | null = null;

  constructor() {
    this.loadConfig();
    this.startConnectivityMonitoring();
    this.startQueueProcessor();
    this.initializeSyncMode();
  }

  /**
   * Charge la configuration
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await hybridStorage.get<SyncConfig>('system_config', 'sync_config');
      if (stored) {
        this.config = { ...this.config, ...stored };
      }
    } catch (error) {
      logger.error('Erreur chargement config sync:', error);
    }
  }

  /**
   * Sauvegarde la configuration
   */
  private async saveConfig(): Promise<void> {
    await hybridStorage.set('system_config', 'sync_config', this.config);
  }

  /**
   * Met à jour la configuration
   */
  async updateConfig(newConfig: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    // Redémarre les services si nécessaire
    this.stopSyncServices();
    this.initializeSyncMode();
  }

  /**
   * Initialise le mode de synchronisation
   */
  private initializeSyncMode(): void {
    if (!this.config.enabled) return;

    switch (this.config.mode) {
      case 'realtime':
        this.startRealtimeSync();
        break;
      case 'batch':
        this.startBatchSync();
        break;
      case 'manual':
        // Rien à faire, synchronisation manuelle uniquement
        break;
    }
  }

  /**
   * Démarre la synchronisation temps réel
   */
  private startRealtimeSync(): void {
    if (this.realtimeSubscription) return;

    try {
      this.realtimeSubscription = supabase
        .channel('storage_sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: '*' // Écouter tous les changements
        }, (payload) => {
          this.handleRealtimeChange(payload);
        })
        .subscribe();

      logger.info('Synchronisation temps réel démarrée');
    } catch (error) {
      logger.error('Erreur démarrage sync temps réel:', error);
    }
  }

  /**
   * Démarre la synchronisation par lot
   */
  private startBatchSync(): void {
    if (this.batchInterval) return;

    // Synchronisation toutes les 5 minutes
    this.batchInterval = setInterval(async () => {
      try {
        await this.performBatchSync();
      } catch (error) {
        logger.error('Erreur sync batch:', error);
      }
    }, 5 * 60 * 1000);

    logger.info('Synchronisation par lot démarrée');
  }

  /**
   * Gère les changements temps réel
   */
  private async handleRealtimeChange(payload: any): Promise<void> {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;

    if (!this.shouldSyncTable(table)) return;

    try {
      switch (eventType) {
        case 'INSERT':
          await this.handleRealtimeInsert(table, newRecord);
          break;
        case 'UPDATE':
          await this.handleRealtimeUpdate(table, newRecord, oldRecord);
          break;
        case 'DELETE':
          await this.handleRealtimeDelete(table, oldRecord);
          break;
      }
    } catch (error) {
      logger.error(`Erreur traitement changement temps réel ${table}:`, error);
    }
  }

  /**
   * Vérifie si une table doit être synchronisée
   */
  private shouldSyncTable(table: string): boolean {
    // Synchronise toutes les tables sauf celles explicitement exclues
    const excludedTables = ['system_backups', 'error_logs'];
    return !excludedTables.includes(table);
  }

  /**
   * Gère l'insertion temps réel
   */
  private async handleRealtimeInsert(table: string, record: any): Promise<void> {
    const item: StorageItem = {
      id: record.id,
      data: record.data || record,
      metadata: {
        createdAt: record.created_at || new Date().toISOString(),
        updatedAt: record.updated_at || new Date().toISOString(),
        version: 1,
        source: 'supabase',
        syncStatus: 'synced',
        checksum: this.generateChecksum(record)
      }
    };

    await hybridStorage.set(table, record.id, item.data);
  }

  /**
   * Gère la mise à jour temps réel
   */
  private async handleRealtimeUpdate(table: string, newRecord: any, oldRecord: any): Promise<void> {
    const localItem = await hybridStorage.get(table, oldRecord.id);

    if (localItem) {
      // Vérifie les conflits
      const hasConflict = this.hasConflict(localItem, {
        id: newRecord.id,
        data: newRecord.data || newRecord,
        metadata: {
          createdAt: newRecord.created_at,
          updatedAt: newRecord.updated_at,
          version: 1,
          source: 'supabase',
          syncStatus: 'synced',
          checksum: this.generateChecksum(newRecord)
        }
      });

      if (hasConflict) {
        await this.handleConflict(table, localItem, {
          id: newRecord.id,
          data: newRecord.data || newRecord,
          metadata: {
            createdAt: newRecord.created_at,
            updatedAt: newRecord.updated_at,
            version: 1,
            source: 'supabase',
            syncStatus: 'synced',
            checksum: this.generateChecksum(newRecord)
          }
        });
      } else {
        await hybridStorage.set(table, newRecord.id, newRecord.data || newRecord);
      }
    } else {
      await this.handleRealtimeInsert(table, newRecord);
    }
  }

  /**
   * Gère la suppression temps réel
   */
  private async handleRealtimeDelete(table: string, record: any): Promise<void> {
    await hybridStorage.set(table, record.id, null); // Soft delete
  }

  /**
   * Effectue une synchronisation par lot
   */
  private async performBatchSync(): Promise<void> {
    if (!navigator.onLine && !this.config.syncWhenOffline) {
      logger.info('Synchronisation ignorée (hors ligne)');
      return;
    }

    const collections = await this.getCollectionsToSync();

    for (const collection of collections) {
      if (this.syncInProgress.get(collection)) continue;

      try {
        await this.syncCollection(collection);
      } catch (error) {
        logger.error(`Erreur sync collection ${collection}:`, error);
      }
    }
  }

  /**
   * Synchronise une collection spécifique
   */
  async syncCollection(collection: string, options: { force?: boolean } = {}): Promise<SyncResult> {
    const startTime = Date.now();

    if (this.syncInProgress.get(collection) && !options.force) {
      logger.info(`Synchronisation ${collection} déjà en cours`);
      return {
        collection,
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 0,
        skipped: 0,
        duration: 0,
        timestamp: new Date().toISOString()
      };
    }

    this.syncInProgress.set(collection, true);

    try {
      let synced = 0;
      let conflicts = 0;
      let errors = 0;
      let skipped = 0;

      // Récupère les éléments locaux modifiés
      const localItems = await this.getModifiedLocalItems(collection);

      // Synchronise chaque élément
      for (const localItem of localItems) {
        try {
          const remoteItem = await this.fetchRemoteItem(collection, localItem.id);

          if (!remoteItem) {
            // Nouvel élément
            await this.pushToRemote(collection, localItem);
            synced++;
          } else if (this.hasConflict(localItem, remoteItem)) {
            // Conflit
            await this.handleConflict(collection, localItem, remoteItem);
            conflicts++;
          } else if (this.isLocalNewer(localItem, remoteItem)) {
            // Version locale plus récente
            await this.pushToRemote(collection, localItem);
            synced++;
          } else {
            // Version distante plus récente
            await this.pullFromRemote(collection, remoteItem);
            synced++;
          }
        } catch (error) {
          errors++;
          logger.error(`Erreur sync item ${localItem.id}:`, error);
        }
      }

      // Récupère les nouveaux éléments distants
      const newRemoteItems = await this.getNewRemoteItems(collection);
      for (const remoteItem of newRemoteItems) {
        try {
          const localItem = await hybridStorage.get(collection, remoteItem.id);
          if (!localItem) {
            await this.pullFromRemote(collection, remoteItem);
            synced++;
          }
        } catch (error) {
          errors++;
          logger.error(`Erreur sync nouvel item distant ${remoteItem.id}:`, error);
        }
      }

      // Met à jour les métadonnées de synchronisation
      await this.updateSyncMetadata(collection);

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        collection,
        success: true,
        synced,
        conflicts,
        errors,
        skipped,
        duration,
        timestamp: new Date().toISOString()
      };

      // Log le résultat
      await this.logSyncResult(result);

      logger.info(`Synchronisation ${collection} terminée: ${synced} sync, ${conflicts} conflits, ${errors} erreurs`);

      return result;

    } finally {
      this.syncInProgress.delete(collection);
    }
  }

  /**
   * Détecte les conflits entre versions
   */
  private hasConflict(local: StorageItem, remote: StorageItem): boolean {
    if (!local.metadata || !remote.metadata) return false;

    // Conflit si les checksums diffèrent et que les deux ont été modifiés
    return local.metadata.checksum !== remote.metadata.checksum &&
           local.metadata.updatedAt !== remote.metadata.updatedAt;
  }

  /**
   * Vérifie si la version locale est plus récente
   */
  private isLocalNewer(local: StorageItem, remote: StorageItem): boolean {
    return new Date(local.metadata.updatedAt) > new Date(remote.metadata.updatedAt);
  }

  /**
   * Gère un conflit selon la stratégie configurée
   */
  private async handleConflict(collection: string, local: StorageItem, remote: StorageItem): Promise<void> {
    const conflictId = `${collection}_${local.id}_${Date.now()}`;

    const conflict: ConflictResolution = {
      id: conflictId,
      collection,
      local,
      remote,
      strategy: this.config.conflictStrategy === 'manual' ? 'manual' : 'local',
      resolved: false,
      timestamp: new Date().toISOString()
    };

    // Log le conflit
    await hybridStorage.set('sync_conflicts', conflictId, conflict);

    switch (this.config.conflictStrategy) {
      case 'last_wins':
        conflict.strategy = this.isLocalNewer(local, remote) ? 'local' : 'remote';
        break;

      case 'merge':
        conflict.strategy = 'merge';
        break;

      case 'manual':
        // Conflit marqué pour résolution manuelle
        return;
    }

    // Applique la résolution automatique
    await this.resolveConflict(conflict);
  }

  /**
   * Résout un conflit
   */
  async resolveConflict(conflict: ConflictResolution): Promise<void> {
    try {
      let resolvedData: any;

      switch (conflict.strategy) {
        case 'local':
          resolvedData = conflict.local.data;
          break;

        case 'remote':
          resolvedData = conflict.remote.data;
          break;

        case 'merge':
          resolvedData = this.mergeData(conflict.local.data, conflict.remote.data);
          break;

        default:
          throw new Error(`Stratégie de résolution inconnue: ${conflict.strategy}`);
      }

      // Applique la résolution
      await hybridStorage.set(conflict.collection, conflict.local.id, resolvedData);

      // Pousse vers le remote si nécessaire
      if (conflict.strategy !== 'remote') {
        await this.pushToRemote(conflict.collection, {
          ...conflict.local,
          data: resolvedData
        });
      }

      // Marque le conflit comme résolu
      conflict.resolved = true;
      await hybridStorage.set('sync_conflicts', conflict.id, conflict);

      logger.info(`Conflit ${conflict.id} résolu avec stratégie ${conflict.strategy}`);

    } catch (error) {
      logger.error(`Erreur résolution conflit ${conflict.id}:`, error);
    }
  }

  /**
   * Fusionne les données en cas de conflit
   */
  private mergeData(localData: any, remoteData: any): any {
    // Stratégie de fusion simple : les propriétés locales gagnent
    // En production, une logique plus sophistiquée serait nécessaire
    return { ...remoteData, ...localData };
  }

  /**
   * Récupère les éléments locaux modifiés
   */
  private async getModifiedLocalItems(collection: string): Promise<StorageItem[]> {
    // Cette méthode devrait être implémentée dans le service hybride
    // Pour l'instant, on utilise une approche simplifiée
    try {
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);
      const items = parsed.collections[collection] || [];

      return items.filter((item: StorageItem) =>
        item.metadata.syncStatus === 'pending' ||
        item.metadata.syncStatus === 'conflict'
      );
    } catch (error) {
      logger.error('Erreur récupération éléments locaux modifiés:', error);
      return [];
    }
  }

  /**
   * Récupère un élément distant
   */
  private async fetchRemoteItem(collection: string, id: string): Promise<StorageItem | null> {
    try {
      const { data, error } = await supabase
        .from(collection)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        data: data.data || data,
        metadata: {
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          version: 1,
          source: 'supabase',
          syncStatus: 'synced',
          checksum: this.generateChecksum(data)
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Pousse un élément vers le remote
   */
  private async pushToRemote(collection: string, item: StorageItem): Promise<void> {
    const { error } = await supabase
      .from(collection)
      .upsert({
        id: item.id,
        data: item.data,
        metadata: item.metadata,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Tire un élément depuis le remote
   */
  private async pullFromRemote(collection: string, item: StorageItem): Promise<void> {
    await hybridStorage.set(collection, item.id, item.data);
  }

  /**
   * Récupère les nouveaux éléments distants
   */
  private async getNewRemoteItems(collection: string): Promise<StorageItem[]> {
    try {
      // Récupère les éléments modifiés récemment
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Dernières 24h

      const { data, error } = await supabase
        .from(collection)
        .select('*')
        .gte('updated_at', since);

      if (error) return [];

      return data.map(item => ({
        id: item.id,
        data: item.data || item,
        metadata: {
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          version: 1,
          source: 'supabase',
          syncStatus: 'synced',
          checksum: this.generateChecksum(item)
        }
      }));
    } catch (error) {
      logger.error('Erreur récupération nouveaux éléments distants:', error);
      return [];
    }
  }

  /**
   * Génère un checksum simple
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Récupère les collections à synchroniser
   */
  private async getCollectionsToSync(): Promise<string[]> {
    // Collections prioritaires d'abord
    const allCollections = [...this.config.priorityCollections];

    try {
      // Ajoute les autres collections depuis les métadonnées
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);

      Object.keys(parsed.collections || {}).forEach(collection => {
        if (!allCollections.includes(collection)) {
          allCollections.push(collection);
        }
      });
    } catch (error) {
      logger.error('Erreur récupération collections:', error);
    }

    return allCollections;
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateSyncMetadata(collection: string): Promise<void> {
    await hybridStorage.set('sync_metadata', collection, {
      lastSync: new Date().toISOString(),
      status: 'completed'
    });
  }

  /**
   * Log le résultat de synchronisation
   */
  private async logSyncResult(result: SyncResult): Promise<void> {
    await hybridStorage.set('sync_logs', `sync_${Date.now()}`, result);
  }

  /**
   * Démarre le monitoring de connectivité
   */
  private startConnectivityMonitoring(): void {
    this.connectivityMonitor = setInterval(() => {
      this.monitorConnectivity();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Monitor la connectivité et adapte la synchronisation
   */
  private async monitorConnectivity(): Promise<void> {
    const isOnline = navigator.onLine;
    const supabaseAvailable = await this.checkSupabaseConnectivity();

    if (this.config.adaptiveSync) {
      if (!isOnline && !supabaseAvailable) {
        // Mode déconnecté
        this.pauseRealtimeSync();
        logger.info('Mode déconnecté activé');
      } else if (isOnline && supabaseAvailable) {
        // Mode connecté
        this.resumeRealtimeSync();
        logger.info('Mode connecté activé');
      }
    }
  }

  /**
   * Vérifie la connectivité Supabase
   */
  private async checkSupabaseConnectivity(): Promise<boolean> {
    try {
      const { error } = await supabase.from('admin_config').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Met en pause la sync temps réel
   */
  private pauseRealtimeSync(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
      logger.info('Synchronisation temps réel mise en pause');
    }
  }

  /**
   * Reprend la sync temps réel
   */
  private resumeRealtimeSync(): void {
    if (!this.realtimeSubscription && this.config.mode === 'realtime') {
      this.startRealtimeSync();
    }
  }

  /**
   * Démarre le processeur de file d'attente
   */
  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(async () => {
      await this.processSyncQueue();
    }, 10000); // Toutes les 10 secondes
  }

  /**
   * Traite la file d'attente de synchronisation
   */
  private async processSyncQueue(): Promise<void> {
    try {
      const queueItems = await this.getQueuedItems();

      for (const item of queueItems) {
        if (item.retryCount >= this.config.retryAttempts) {
          // Marque comme échoué définitivement
          await this.markQueueItemFailed(item);
          continue;
        }

        try {
          await this.processQueueItem(item);
          await this.removeFromQueue(item.id);
        } catch (error) {
          // Incrémente le compteur de retry
          item.retryCount++;
          await this.updateQueueItem(item);
          logger.warn(`Retry ${item.retryCount}/${this.config.retryAttempts} pour ${item.id}`);
        }
      }
    } catch (error) {
      logger.error('Erreur traitement file d\'attente:', error);
    }
  }

  /**
   * Récupère les éléments en file d'attente
   */
  private async getQueuedItems(): Promise<SyncQueueItem[]> {
    try {
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);
      return parsed.collections['sync_queue'] || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Traite un élément de la file d'attente
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'create':
      case 'update':
        await hybridStorage.set(item.collection, item.id, item.data);
        break;
      case 'delete':
        await hybridStorage.set(item.collection, item.id, null);
        break;
    }
  }

  /**
   * Ajoute à la file d'attente de synchronisation
   */
  async addToSyncQueue(collection: string, id: string, action: 'create' | 'update' | 'delete', data: any, priority = 1): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${collection}_${id}_${Date.now()}`,
      collection,
      action,
      data,
      priority,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    await hybridStorage.set('sync_queue', queueItem.id, queueItem);
  }

  /**
   * Marque un élément de file d'attente comme échoué
   */
  private async markQueueItemFailed(item: SyncQueueItem): Promise<void> {
    item.retryCount = -1; // Marque comme échoué
    await this.updateQueueItem(item);
  }

  /**
   * Met à jour un élément de file d'attente
   */
  private async updateQueueItem(item: SyncQueueItem): Promise<void> {
    await hybridStorage.set('sync_queue', item.id, item);
  }

  /**
   * Supprime de la file d'attente
   */
  private async removeFromQueue(id: string): Promise<void> {
    await hybridStorage.set('sync_queue', id, null);
  }

  /**
   * Synchronisation manuelle complète
   */
  async performFullSync(): Promise<SyncResult[]> {
    logger.info('Début synchronisation complète manuelle');

    const collections = await this.getCollectionsToSync();
    const results: SyncResult[] = [];

    for (const collection of collections) {
      try {
        const result = await this.syncCollection(collection, { force: true });
        results.push(result);
      } catch (error) {
        logger.error(`Erreur sync complète ${collection}:`, error);
        results.push({
          collection,
          success: false,
          synced: 0,
          conflicts: 0,
          errors: 1,
          skipped: 0,
          duration: 0,
          timestamp: new Date().toISOString()
        });
      }
    }

    logger.info(`Synchronisation complète terminée: ${results.length} collections`);
    return results;
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(): Promise<any> {
    try {
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);

      const conflicts = parsed.collections['sync_conflicts'] || [];
      const logs = parsed.collections['sync_logs'] || [];
      const queue = parsed.collections['sync_queue'] || [];

      const recentLogs = logs.slice(-10); // Derniers 10 logs

      return {
        conflicts: {
          total: conflicts.length,
          unresolved: conflicts.filter((c: ConflictResolution) => !c.resolved).length
        },
        queue: {
          pending: queue.filter((q: SyncQueueItem) => q.retryCount >= 0).length,
          failed: queue.filter((q: SyncQueueItem) => q.retryCount < 0).length
        },
        recentActivity: recentLogs,
        lastFullSync: logs.length > 0 ? logs[logs.length - 1].timestamp : null
      };
    } catch (error) {
      logger.error('Erreur récupération stats sync:', error);
      return {};
    }
  }

  /**
   * Liste les conflits non résolus
   */
  async getUnresolvedConflicts(): Promise<ConflictResolution[]> {
    try {
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);
      const conflicts = parsed.collections['sync_conflicts'] || [];

      return conflicts.filter((c: ConflictResolution) => !c.resolved);
    } catch (error) {
      logger.error('Erreur récupération conflits:', error);
      return [];
    }
  }

  /**
   * Arrête tous les services de synchronisation
   */
  private stopSyncServices(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }

    if (this.connectivityMonitor) {
      clearInterval(this.connectivityMonitor);
      this.connectivityMonitor = null;
    }
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.stopSyncServices();
  }
}

// Instance globale du service
export const syncService = new SyncService();

// Cleanup automatique
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncService.destroy();
  });
}