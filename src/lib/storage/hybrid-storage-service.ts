/**
 * Service de stockage hybride avancé pour Emarzona
 * Combine Supabase, IndexedDB et localStorage avec synchronisation intelligente
 * et mécanismes de résilience en cas de panne
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Types pour le stockage hybride
export interface StorageItem<T = any> {
  id: string;
  data: T;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    source: 'supabase' | 'indexeddb' | 'localstorage';
    syncStatus: 'synced' | 'pending' | 'conflict' | 'offline';
    checksum: string;
  };
}

export interface StorageConfig {
  collection: string;
  enableOffline: boolean;
  syncInterval: number; // en minutes
  maxRetries: number;
  enableBackup: boolean;
  backupInterval: number; // en heures
}

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  duration: number;
}

export class HybridStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'emarzona_storage';
  private readonly DB_VERSION = 1;
  private syncInProgress = new Set<string>();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeIndexedDB();
    this.startHealthMonitoring();
  }

  /**
   * Initialise IndexedDB pour le stockage local
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        logger.error('Erreur IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialisé avec succès');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Crée les object stores IndexedDB
   */
  private createObjectStores(db: IDBDatabase): void {
    // Store principal pour les données
    if (!db.objectStoreNames.contains('data')) {
      const dataStore = db.createObjectStore('data', { keyPath: 'id' });
      dataStore.createIndex('collection', 'collection', { unique: false });
      dataStore.createIndex('syncStatus', 'metadata.syncStatus', { unique: false });
      dataStore.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
    }

    // Store pour les métadonnées de synchronisation
    if (!db.objectStoreNames.contains('sync_metadata')) {
      const syncStore = db.createObjectStore('sync_metadata', { keyPath: 'collection' });
      syncStore.createIndex('lastSync', 'lastSync', { unique: false });
    }

    // Store pour les sauvegardes
    if (!db.objectStoreNames.contains('backups')) {
      const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
      backupStore.createIndex('collection', 'collection', { unique: false });
      backupStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Store pour l'historique des erreurs
    if (!db.objectStoreNames.contains('error_log')) {
      const errorStore = db.createObjectStore('error_log', { keyPath: 'id' });
      errorStore.createIndex('timestamp', 'timestamp', { unique: false });
      errorStore.createIndex('type', 'type', { unique: false });
    }
  }

  /**
   * Démarre le monitoring de santé du stockage
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Toutes les minutes
  }

  /**
   * Effectue une vérification de santé des systèmes de stockage
   */
  private async performHealthCheck(): Promise<void> {
    const health = {
      supabase: false,
      indexeddb: false,
      localstorage: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test Supabase
      const { error } = await supabase.from('admin_config').select('key').limit(1);
      health.supabase = !error;
    } catch (err) {
      logger.warn('Supabase health check failed:', err);
    }

    // Test IndexedDB
    health.indexeddb = !!this.db;

    // Test localStorage
    try {
      localStorage.setItem('health_test', 'ok');
      localStorage.removeItem('health_test');
      health.localstorage = true;
    } catch (err) {
      logger.warn('localStorage health check failed:', err);
    }

    // Stocke l'état de santé
    const healthKey = 'storage_health';
    localStorage.setItem(healthKey, JSON.stringify(health));

    // Log les problèmes
    const issues = Object.entries(health)
      .filter(([key, value]) => key !== 'timestamp' && !value)
      .map(([key]) => key);

    if (issues.length > 0) {
      logger.warn(`Storage health issues detected: ${issues.join(', ')}`);
    }
  }

  /**
   * Stocke un élément avec stratégie hybride
   */
  async set<T>(
    collection: string,
    id: string,
    data: T,
    config: Partial<StorageConfig> = {}
  ): Promise<void> {
    const fullConfig: StorageConfig = {
      collection,
      enableOffline: true,
      syncInterval: 5,
      maxRetries: 3,
      enableBackup: true,
      backupInterval: 24,
      ...config
    };

    const item: StorageItem<T> = {
      id,
      data,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        source: 'indexeddb',
        syncStatus: 'pending',
        checksum: this.generateChecksum(data)
      }
    };

    try {
      // Stockage local prioritaire
      await this.storeLocally(collection, item);

      // Tentative de synchronisation avec Supabase
      if (await this.isSupabaseAvailable()) {
        await this.syncToSupabase(collection, item);
        item.metadata.syncStatus = 'synced';
        item.metadata.source = 'supabase';
      } else {
        logger.warn(`Supabase indisponible, stockage local seulement pour ${collection}:${id}`);
      }

      // Mise à jour avec le statut final
      await this.storeLocally(collection, item);

      // Sauvegarde automatique si activée
      if (fullConfig.enableBackup) {
        await this.createBackup(collection, id, data);
      }

    } catch (error) {
      logger.error(`Erreur stockage ${collection}:${id}:`, error);
      await this.logError('storage_error', { collection, id, error: error.message });

      // Fallback vers localStorage en cas d'échec total
      this.fallbackToLocalStorage(collection, id, data);
    }
  }

  /**
   * Récupère un élément avec stratégie de fallback
   */
  async get<T>(collection: string, id: string): Promise<T | null> {
    try {
      // Essai Supabase d'abord
      if (await this.isSupabaseAvailable()) {
        const supabaseData = await this.fetchFromSupabase(collection, id);
        if (supabaseData) {
          // Met à jour le cache local
          await this.storeLocally(collection, supabaseData);
          return supabaseData.data;
        }
      }

      // Fallback vers IndexedDB
      const localData = await this.fetchFromIndexedDB(collection, id);
      if (localData) {
        return localData.data;
      }

      // Fallback vers localStorage
      return this.fetchFromLocalStorage(collection, id);

    } catch (error) {
      logger.error(`Erreur récupération ${collection}:${id}:`, error);
      await this.logError('fetch_error', { collection, id, error: error.message });

      // Dernier recours : localStorage
      return this.fetchFromLocalStorage(collection, id);
    }
  }

  /**
   * Synchronise une collection avec gestion des conflits
   */
  async syncCollection(collection: string): Promise<SyncResult> {
    const startTime = Date.now();

    if (this.syncInProgress.has(collection)) {
      logger.info(`Synchronisation ${collection} déjà en cours`);
      return { success: false, synced: 0, conflicts: 0, errors: 0, duration: 0 };
    }

    this.syncInProgress.add(collection);

    try {
      let synced = 0;
      let conflicts = 0;
      let errors = 0;

      // Récupère les éléments locaux non synchronisés
      const pendingItems = await this.getPendingItems(collection);

      for (const item of pendingItems) {
        try {
          const supabaseItem = await this.fetchFromSupabase(collection, item.id);

          if (!supabaseItem) {
            // Nouvel élément, l'uploader
            await this.syncToSupabase(collection, item);
            synced++;
          } else if (this.hasConflict(item, supabaseItem)) {
            // Conflit détecté
            const resolved = await this.resolveConflict(collection, item, supabaseItem);
            conflicts++;
            if (resolved) synced++;
          } else if (item.metadata.updatedAt > supabaseItem.metadata.updatedAt) {
            // Version locale plus récente
            await this.syncToSupabase(collection, item);
            synced++;
          }

          // Marque comme synchronisé
          item.metadata.syncStatus = 'synced';
          await this.storeLocally(collection, item);

        } catch (err) {
          errors++;
          logger.error(`Erreur sync item ${item.id}:`, err);
        }
      }

      // Met à jour les métadonnées de synchronisation
      await this.updateSyncMetadata(collection);

      const duration = Date.now() - startTime;
      logger.info(`Synchronisation ${collection} terminée: ${synced} sync, ${conflicts} conflits, ${errors} erreurs`);

      return { success: true, synced, conflicts, errors, duration };

    } finally {
      this.syncInProgress.delete(collection);
    }
  }

  /**
   * Crée une sauvegarde d'un élément
   */
  private async createBackup<T>(collection: string, id: string, data: T): Promise<void> {
    if (!this.db) return;

    const backup = {
      id: `${collection}_${id}_${Date.now()}`,
      collection,
      itemId: id,
      data,
      createdAt: new Date().toISOString(),
      checksum: this.generateChecksum(data)
    };

    const transaction = this.db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await this.promisifyRequest(store.add(backup));

    // Nettoie les anciennes sauvegardes (garde les 10 plus récentes par élément)
    await this.cleanupOldBackups(collection, id);
  }

  /**
   * Récupère un élément depuis Supabase
   */
  private async fetchFromSupabase(collection: string, id: string): Promise<StorageItem | null> {
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      data: data.data,
      metadata: data.metadata
    };
  }

  /**
   * Stocke un élément dans Supabase
   */
  private async syncToSupabase(collection: string, item: StorageItem): Promise<void> {
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
   * Stocke un élément localement (IndexedDB)
   */
  private async storeLocally(collection: string, item: StorageItem): Promise<void> {
    if (!this.db) throw new Error('IndexedDB non initialisé');

    const dataWithCollection = { ...item, collection };
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    await this.promisifyRequest(store.put(dataWithCollection));
  }

  /**
   * Récupère un élément depuis IndexedDB
   */
  private async fetchFromIndexedDB(collection: string, id: string): Promise<StorageItem | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const result = await this.promisifyRequest(store.get(id));

    return result && result.collection === collection ? result : null;
  }

  /**
   * Fallback vers localStorage
   */
  private fallbackToLocalStorage(collection: string, id: string, data: any): void {
    try {
      const key = `storage_${collection}_${id}`;
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        fallback: true
      }));
    } catch (error) {
      logger.error('Erreur localStorage fallback:', error);
    }
  }

  /**
   * Récupère depuis localStorage (fallback)
   */
  private fetchFromLocalStorage(collection: string, id: string): any {
    try {
      const key = `storage_${collection}_${id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.fallback ? parsed.data : null;
      }
    } catch (error) {
      logger.error('Erreur lecture localStorage:', error);
    }
    return null;
  }

  /**
   * Vérifie si Supabase est disponible
   */
  private async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('admin_config').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Génère un checksum pour détecter les changements
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32 bits
    }
    return hash.toString(36);
  }

  /**
   * Détecte les conflits entre versions
   */
  private hasConflict(local: StorageItem, remote: StorageItem): boolean {
    return local.metadata.checksum !== remote.metadata.checksum &&
           local.metadata.updatedAt !== remote.metadata.updatedAt;
  }

  /**
   * Résout un conflit (stratégie: dernière modification gagne)
   */
  private async resolveConflict(collection: string, local: StorageItem, remote: StorageItem): Promise<boolean> {
    const winner = local.metadata.updatedAt > remote.metadata.updatedAt ? local : remote;
    const loser = local.metadata.updatedAt > remote.metadata.updatedAt ? remote : local;

    try {
      // Synchronise le gagnant
      await this.syncToSupabase(collection, winner);

      // Log le conflit pour audit
      await this.logError('sync_conflict', {
        collection,
        itemId: local.id,
        winner: winner.metadata.source,
        loser: loser.metadata.source,
        winnerUpdated: winner.metadata.updatedAt,
        loserUpdated: loser.metadata.updatedAt
      });

      return true;
    } catch (error) {
      logger.error('Erreur résolution conflit:', error);
      return false;
    }
  }

  /**
   * Récupère les éléments en attente de synchronisation
   */
  private async getPendingItems(collection: string): Promise<StorageItem[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const index = store.index('syncStatus');
    const request = index.getAll('pending');

    const results = await this.promisifyRequest(request);
    return results.filter((item: any) => item.collection === collection);
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateSyncMetadata(collection: string): Promise<void> {
    if (!this.db) return;

    const metadata = {
      collection,
      lastSync: new Date().toISOString(),
      status: 'completed'
    };

    const transaction = this.db.transaction(['sync_metadata'], 'readwrite');
    const store = transaction.objectStore('sync_metadata');
    await this.promisifyRequest(store.put(metadata));
  }

  /**
   * Nettoie les anciennes sauvegardes
   */
  private async cleanupOldBackups(collection: string, itemId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    const index = store.index('collection');
    const request = index.getAll(collection);

    const backups = await this.promisifyRequest(request);
    const itemBackups = backups.filter((b: any) => b.itemId === itemId);

    if (itemBackups.length > 10) {
      // Trie par date et supprime les plus anciennes
      itemBackups.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      for (let i = 10; i < itemBackups.length; i++) {
        await this.promisifyRequest(store.delete(itemBackups[i].id));
      }
    }
  }

  /**
   * Log une erreur dans IndexedDB
   */
  private async logError(type: string, details: any): Promise<void> {
    if (!this.db) return;

    const errorLog = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      details,
      timestamp: new Date().toISOString()
    };

    const transaction = this.db.transaction(['error_log'], 'readwrite');
    const store = transaction.objectStore('error_log');
    await this.promisifyRequest(store.add(errorLog));
  }

  /**
   * Utilitaire pour promisifier les requêtes IndexedDB
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Exporte toutes les données pour backup
   */
  async exportData(): Promise<string> {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections: {}
    };

    // Exporte toutes les collections depuis IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.getAll();

      const allData = await this.promisifyRequest(request);

      // Groupe par collection
      const collections: Record<string, StorageItem[]> = {};
      allData.forEach((item: any) => {
        if (!collections[item.collection]) {
          collections[item.collection] = [];
        }
        collections[item.collection].push(item);
      });

      exportData.collections = collections;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importe des données depuis un backup
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.collections) {
        throw new Error('Format de données invalide');
      }

      // Importe chaque collection
      for (const [collection, items] of Object.entries(importData.collections as Record<string, StorageItem[]>)) {
        for (const item of items) {
          await this.storeLocally(collection, item);
        }
      }

      logger.info('Import des données terminé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'import:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de stockage
   */
  async getStorageStats(): Promise<any> {
    const stats = {
      indexeddb: { collections: 0, items: 0, size: 0 },
      localstorage: { items: 0, size: 0 },
      supabase: { available: false },
      sync: { pending: 0, conflicts: 0 },
      health: {}
    };

    // Stats IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const allData = await this.promisifyRequest(store.getAll());

      const collections = new Set(allData.map((item: any) => item.collection));
      stats.indexeddb.collections = collections.size;
      stats.indexeddb.items = allData.length;
      stats.indexeddb.size = JSON.stringify(allData).length;
    }

    // Stats localStorage
    if (typeof Storage !== 'undefined') {
      let lsItems = 0;
      let lsSize = 0;
      for (let key in localStorage) {
        if (key.startsWith('storage_')) {
          lsItems++;
          lsSize += localStorage[key].length;
        }
      }
      stats.localstorage.items = lsItems;
      stats.localstorage.size = lsSize;
    }

    // Stats Supabase
    stats.supabase.available = await this.isSupabaseAvailable();

    // Stats synchronisation
    if (this.db) {
      const transaction = this.db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const pendingRequest = store.index('syncStatus').getAll('pending');
      const conflictRequest = store.index('syncStatus').getAll('conflict');

      const pending = await this.promisifyRequest(pendingRequest);
      const conflicts = await this.promisifyRequest(conflictRequest);

      stats.sync.pending = pending.length;
      stats.sync.conflicts = conflicts.length;
    }

    // Santé du système
    const healthKey = localStorage.getItem('storage_health');
    if (healthKey) {
      stats.health = JSON.parse(healthKey);
    }

    return stats;
  }
}

// Instance globale du service
export const hybridStorage = new HybridStorageService();

// Cleanup automatique
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    hybridStorage.destroy();
  });
}