/**
 * Service de sauvegarde avancé pour Emarzona
 * Gestion des sauvegardes automatiques, manuelles et de récupération
 */

import { hybridStorage, StorageItem } from './hybrid-storage-service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BackupConfig {
  enabled: boolean;
  automatic: boolean;
  intervalHours: number;
  maxBackups: number;
  compress: boolean;
  encrypt: boolean;
  storage: 'indexeddb' | 'supabase' | 'external';
  collections: string[];
}

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  type: 'automatic' | 'manual' | 'emergency';
  collections: string[];
  createdAt: string;
  size: number;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

export interface RestoreOptions {
  collections?: string[];
  overwrite: boolean;
  validateData: boolean;
  dryRun: boolean;
}

export class BackupService {
  private config: BackupConfig = {
    enabled: true,
    automatic: true,
    intervalHours: 24,
    maxBackups: 30,
    compress: true,
    encrypt: false,
    storage: 'indexeddb',
    collections: ['admin_config', 'user_data', 'products', 'orders', 'analytics']
  };

  private backupInterval: NodeJS.Timeout | null = null;
  private readonly BACKUP_PREFIX = 'backup_';

  constructor() {
    this.loadConfig();
    this.startAutomaticBackups();
  }

  /**
   * Charge la configuration depuis le stockage
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await hybridStorage.get<BackupConfig>('system_config', 'backup_config');
      if (stored) {
        this.config = { ...this.config, ...stored };
      }
    } catch (error) {
      logger.error('Erreur chargement config backup:', error);
    }
  }

  /**
   * Sauvegarde la configuration
   */
  private async saveConfig(): Promise<void> {
    await hybridStorage.set('system_config', 'backup_config', this.config);
  }

  /**
   * Démarre les sauvegardes automatiques
   */
  private startAutomaticBackups(): void {
    if (!this.config.enabled || !this.config.automatic) return;

    this.backupInterval = setInterval(async () => {
      try {
        await this.createAutomaticBackup();
      } catch (error) {
        logger.error('Erreur sauvegarde automatique:', error);
      }
    }, this.config.intervalHours * 60 * 60 * 1000);

    logger.info(`Sauvegardes automatiques démarrées (intervalle: ${this.config.intervalHours}h)`);
  }

  /**
   * Arrête les sauvegardes automatiques
   */
  stopAutomaticBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      logger.info('Sauvegardes automatiques arrêtées');
    }
  }

  /**
   * Met à jour la configuration
   */
  async updateConfig(newConfig: Partial<BackupConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    // Redémarre les sauvegardes si nécessaire
    this.stopAutomaticBackups();
    this.startAutomaticBackups();
  }

  /**
   * Crée une sauvegarde automatique
   */
  private async createAutomaticBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${this.BACKUP_PREFIX}auto_${timestamp}`;

    await this.createBackup({
      id: backupId,
      name: `Sauvegarde automatique ${new Date().toLocaleString('fr-FR')}`,
      type: 'automatic',
      collections: this.config.collections
    });
  }

  /**
   * Crée une sauvegarde manuelle
   */
  async createManualBackup(name: string, description?: string, collections?: string[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${this.BACKUP_PREFIX}manual_${timestamp}`;

    await this.createBackup({
      id: backupId,
      name,
      description,
      type: 'manual',
      collections: collections || this.config.collections
    });

    return backupId;
  }

  /**
   * Crée une sauvegarde d'urgence (en cas de panne détectée)
   */
  async createEmergencyBackup(reason: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${this.BACKUP_PREFIX}emergency_${timestamp}`;

    logger.warn(`Création sauvegarde d'urgence: ${reason}`);

    await this.createBackup({
      id: backupId,
      name: `Sauvegarde d'urgence - ${reason}`,
      description: `Créée automatiquement en raison: ${reason}`,
      type: 'emergency',
      collections: this.config.collections
    });

    return backupId;
  }

  /**
   * Crée une sauvegarde avec les paramètres spécifiés
   */
  private async createBackup(params: {
    id: string;
    name: string;
    description?: string;
    type: 'automatic' | 'manual' | 'emergency';
    collections: string[];
  }): Promise<void> {
    const { id, name, description, type, collections } = params;

    try {
      // Met à jour le statut en cours
      const metadata: BackupMetadata = {
        id,
        name,
        description,
        type,
        collections,
        createdAt: new Date().toISOString(),
        size: 0,
        checksum: '',
        compressed: this.config.compress,
        encrypted: this.config.encrypt,
        status: 'in_progress'
      };

      await this.saveBackupMetadata(metadata);

      // Collecte les données
      const backupData: Record<string, StorageItem[]> = {};

      for (const collection of collections) {
        try {
          const items = await this.collectCollectionData(collection);
          if (items.length > 0) {
            backupData[collection] = items;
          }
        } catch (error) {
          logger.warn(`Erreur collecte ${collection}:`, error);
        }
      }

      // Compression
      let finalData = JSON.stringify(backupData);
      if (this.config.compress) {
        finalData = await this.compressData(finalData);
      }

      // Chiffrement (si activé)
      if (this.config.encrypt) {
        finalData = await this.encryptData(finalData);
      }

      // Calcul de la taille et du checksum
      metadata.size = finalData.length;
      metadata.checksum = await this.generateChecksum(finalData);
      metadata.status = 'completed';

      // Stockage selon la configuration
      await this.storeBackupData(id, finalData, this.config.storage);

      // Sauvegarde finale des métadonnées
      await this.saveBackupMetadata(metadata);

      // Nettoie les anciennes sauvegardes
      await this.cleanupOldBackups();

      logger.info(`Sauvegarde ${id} créée avec succès (${metadata.size} octets)`);

    } catch (error) {
      logger.error(`Erreur création sauvegarde ${id}:`, error);

      // Met à jour le statut en erreur
      const errorMetadata: BackupMetadata = {
        id,
        name,
        type,
        collections,
        createdAt: new Date().toISOString(),
        size: 0,
        checksum: '',
        compressed: false,
        encrypted: false,
        status: 'failed',
        error: error.message
      };

      await this.saveBackupMetadata(errorMetadata);
      throw error;
    }
  }

  /**
   * Collecte les données d'une collection
   */
  private async collectCollectionData(collection: string): Promise<StorageItem[]> {
    const items: StorageItem[] = [];

    // Depuis IndexedDB (stockage principal)
    try {
      // Note: Cette méthode devrait être ajoutée au service hybride
      const localItems = await this.getAllFromCollection(collection);
      items.push(...localItems);
    } catch (error) {
      logger.warn(`Erreur collecte locale ${collection}:`, error);
    }

    // Depuis Supabase si disponible
    try {
      const { data, error } = await supabase.from(collection).select('*');
      if (!error && data) {
        data.forEach(item => {
          items.push({
            id: item.id,
            data: item.data || item,
            metadata: item.metadata || {
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || new Date().toISOString(),
              version: 1,
              source: 'supabase',
              syncStatus: 'synced',
              checksum: ''
            }
          });
        });
      }
    } catch (error) {
      logger.warn(`Erreur collecte Supabase ${collection}:`, error);
    }

    // Déduplique par ID (garde la version la plus récente)
    const uniqueItems = new Map<string, StorageItem>();
    items.forEach(item => {
      const existing = uniqueItems.get(item.id);
      if (!existing || item.metadata.updatedAt > existing.metadata.updatedAt) {
        uniqueItems.set(item.id, item);
      }
    });

    return Array.from(uniqueItems.values());
  }

  /**
   * Récupère tous les éléments d'une collection (méthode helper)
   */
  private async getAllFromCollection(collection: string): Promise<StorageItem[]> {
    // Cette méthode utilise l'export du service hybride
    const exportData = await hybridStorage.exportData();
    const parsed = JSON.parse(exportData);
    return parsed.collections[collection] || [];
  }

  /**
   * Compresse les données
   */
  private async compressData(data: string): Promise<string> {
    // Utilise la compression native du navigateur si disponible
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(new TextEncoder().encode(data));
        writer.close();

        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        // Convertit en base64 pour le stockage
        return btoa(String.fromCharCode(...compressed));
      } catch (error) {
        logger.warn('Erreur compression, utilisation des données non compressées:', error);
      }
    }

    return data;
  }

  /**
   * Décompresse les données
   */
  private async decompressData(compressedData: string): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        // Convertit depuis base64
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));

        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(compressed);
        writer.close();

        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
      } catch (error) {
        logger.warn('Erreur décompression:', error);
      }
    }

    return compressedData;
  }

  /**
   * Chiffre les données (implémentation basique)
   */
  private async encryptData(data: string): Promise<string> {
    // Note: En production, utiliser une vraie implémentation de chiffrement
    // Ici on utilise une transformation simple pour la démonstration
    const encoded = btoa(data);
    return `encrypted:${encoded}`;
  }

  /**
   * Déchiffre les données
   */
  private async decryptData(encryptedData: string): Promise<string> {
    if (encryptedData.startsWith('encrypted:')) {
      return atob(encryptedData.substring(10));
    }
    return encryptedData;
  }

  /**
   * Génère un checksum des données
   */
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Stocke les données de sauvegarde
   */
  private async storeBackupData(id: string, data: string, storage: string): Promise<void> {
    switch (storage) {
      case 'indexeddb':
        await hybridStorage.set('backups', id, { data, timestamp: new Date().toISOString() });
        break;

      case 'supabase':
        await supabase.from('system_backups').upsert({
          id,
          data,
          created_at: new Date().toISOString()
        });
        break;

      case 'external':
        // Pour un stockage externe (S3, etc.), à implémenter selon les besoins
        logger.info(`Sauvegarde externe ${id} simulée`);
        break;

      default:
        throw new Error(`Type de stockage non supporté: ${storage}`);
    }
  }

  /**
   * Sauvegarde les métadonnées de sauvegarde
   */
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await hybridStorage.set('backup_metadata', metadata.id, metadata);
  }

  /**
   * Nettoie les anciennes sauvegardes
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const allBackups = await this.listBackups();
      const automaticBackups = allBackups.filter(b => b.type === 'automatic');

      if (automaticBackups.length > this.config.maxBackups) {
        // Trie par date et supprime les plus anciennes
        automaticBackups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const toDelete = automaticBackups.slice(this.config.maxBackups);
        for (const backup of toDelete) {
          await this.deleteBackup(backup.id);
        }

        logger.info(`${toDelete.length} anciennes sauvegardes supprimées`);
      }
    } catch (error) {
      logger.error('Erreur nettoyage sauvegardes:', error);
    }
  }

  /**
   * Liste toutes les sauvegardes
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);
      const metadata = parsed.collections['backup_metadata'] || [];

      return metadata.map((item: StorageItem) => item.data as BackupMetadata)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error('Erreur listage sauvegardes:', error);
      return [];
    }
  }

  /**
   * Supprime une sauvegarde
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Supprime les métadonnées
      await hybridStorage.set('backup_metadata', backupId, null);

      // Supprime les données selon le stockage
      switch (this.config.storage) {
        case 'indexeddb':
          await hybridStorage.set('backups', backupId, null);
          break;

        case 'supabase':
          await supabase.from('system_backups').delete().eq('id', backupId);
          break;
      }

      logger.info(`Sauvegarde ${backupId} supprimée`);
    } catch (error) {
      logger.error(`Erreur suppression sauvegarde ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Restaure une sauvegarde
   */
  async restoreBackup(backupId: string, options: RestoreOptions = { overwrite: true, validateData: true, dryRun: false }): Promise<void> {
    try {
      logger.info(`Début restauration sauvegarde ${backupId}`);

      // Récupère les métadonnées
      const metadata = await hybridStorage.get<BackupMetadata>('backup_metadata', backupId);
      if (!metadata) {
        throw new Error(`Sauvegarde ${backupId} introuvable`);
      }

      // Récupère les données
      let backupData: string;
      switch (this.config.storage) {
        case 'indexeddb':
          const backupItem = await hybridStorage.get('backups', backupId);
          backupData = backupItem?.data;
          break;

        case 'supabase':
          const { data } = await supabase.from('system_backups').select('data').eq('id', backupId).single();
          backupData = data?.data;
          break;

        default:
          throw new Error(`Type de stockage non supporté: ${this.config.storage}`);
      }

      if (!backupData) {
        throw new Error(`Données de sauvegarde ${backupId} introuvables`);
      }

      // Déchiffrement
      if (metadata.encrypted) {
        backupData = await this.decryptData(backupData);
      }

      // Décompression
      if (metadata.compressed) {
        backupData = await this.decompressData(backupData);
      }

      // Parse les données
      const parsedData = JSON.parse(backupData);

      // Validation
      if (options.validateData) {
        await this.validateBackupData(parsedData, metadata);
      }

      // Mode dry-run
      if (options.dryRun) {
        logger.info(`Mode dry-run: ${Object.keys(parsedData).length} collections seraient restaurées`);
        return;
      }

      // Restauration
      const collectionsToRestore = options.collections || metadata.collections;

      for (const collection of collectionsToRestore) {
        if (parsedData[collection]) {
          logger.info(`Restauration collection ${collection}: ${parsedData[collection].length} éléments`);

          for (const item of parsedData[collection]) {
            try {
              // Vérifie si l'élément existe déjà
              const existing = await hybridStorage.get(collection, item.id);

              if (!existing || options.overwrite) {
                await hybridStorage.set(collection, item.id, item.data);
              } else {
                logger.info(`Élément ${collection}:${item.id} existe déjà, ignoré`);
              }
            } catch (error) {
              logger.error(`Erreur restauration ${collection}:${item.id}:`, error);
            }
          }
        }
      }

      logger.info(`Restauration sauvegarde ${backupId} terminée avec succès`);

    } catch (error) {
      logger.error(`Erreur restauration sauvegarde ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les données de sauvegarde
   */
  private async validateBackupData(data: any, metadata: BackupMetadata): Promise<void> {
    // Vérifie la structure de base
    if (!data || typeof data !== 'object') {
      throw new Error('Format de données invalide');
    }

    // Vérifie le checksum
    const dataString = JSON.stringify(data);
    const calculatedChecksum = await this.generateChecksum(dataString);

    if (calculatedChecksum !== metadata.checksum) {
      throw new Error('Checksum invalide - données corrompues');
    }

    // Validation basique des collections
    for (const collection of metadata.collections) {
      if (data[collection] && !Array.isArray(data[collection])) {
        throw new Error(`Collection ${collection} invalide`);
      }
    }

    logger.info('Validation des données de sauvegarde réussie');
  }

  /**
   * Exporte une sauvegarde vers un fichier
   */
  async exportBackupToFile(backupId: string): Promise<void> {
    try {
      const metadata = await hybridStorage.get<BackupMetadata>('backup_metadata', backupId);
      if (!metadata) {
        throw new Error(`Sauvegarde ${backupId} introuvable`);
      }

      // Récupère les données (même logique que restore)
      let backupData: string;
      switch (this.config.storage) {
        case 'indexeddb':
          const backupItem = await hybridStorage.get('backups', backupId);
          backupData = backupItem?.data;
          break;

        case 'supabase':
          const { data } = await supabase.from('system_backups').select('data').eq('id', backupId).single();
          backupData = data?.data;
          break;
      }

      if (!backupData) {
        throw new Error(`Données introuvables pour ${backupId}`);
      }

      // Crée le fichier de téléchargement
      const exportData = {
        metadata,
        data: backupData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info(`Sauvegarde ${backupId} exportée vers fichier`);

    } catch (error) {
      logger.error(`Erreur export sauvegarde ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Importe une sauvegarde depuis un fichier
   */
  async importBackupFromFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.metadata || !importData.data) {
        throw new Error('Format de fichier invalide');
      }

      const metadata: BackupMetadata = importData.metadata;
      let backupData = importData.data;

      // Déchiffrement si nécessaire
      if (metadata.encrypted) {
        backupData = await this.decryptData(backupData);
      }

      // Décompression si nécessaire
      if (metadata.compressed) {
        backupData = await this.decompressData(backupData);
      }

      // Validation
      const parsedData = JSON.parse(backupData);
      await this.validateBackupData(parsedData, metadata);

      // Stockage des données
      await this.storeBackupData(metadata.id, importData.data, this.config.storage);
      await this.saveBackupMetadata(metadata);

      logger.info(`Sauvegarde ${metadata.id} importée depuis fichier`);

    } catch (error) {
      logger.error('Erreur import sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des sauvegardes
   */
  async getBackupStats(): Promise<any> {
    try {
      const backups = await this.listBackups();

      const stats = {
        total: backups.length,
        byType: {
          automatic: backups.filter(b => b.type === 'automatic').length,
          manual: backups.filter(b => b.type === 'manual').length,
          emergency: backups.filter(b => b.type === 'emergency').length
        },
        byStatus: {
          completed: backups.filter(b => b.status === 'completed').length,
          failed: backups.filter(b => b.status === 'failed').length,
          inProgress: backups.filter(b => b.status === 'in_progress').length
        },
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        lastBackup: backups.length > 0 ? backups[0].createdAt : null,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null
      };

      return stats;
    } catch (error) {
      logger.error('Erreur récupération stats sauvegardes:', error);
      return {};
    }
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.stopAutomaticBackups();
  }
}

// Instance globale du service
export const backupService = new BackupService();

// Cleanup automatique
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    backupService.destroy();
  });
}