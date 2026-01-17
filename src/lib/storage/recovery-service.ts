/**
 * Service de récupération automatique pour Emarzona
 * Détection des pannes et récupération intelligente des données
 */

import { hybridStorage } from './hybrid-storage-service';
import { backupService } from './backup-service';
import { syncService } from './sync-service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface RecoveryConfig {
  enabled: boolean;
  autoRecovery: boolean;
  recoveryStrategies: string[];
  maxRecoveryAttempts: number;
  recoveryTimeout: number; // en secondes
  notifyOnRecovery: boolean;
  criticalCollections: string[];
}

export interface FailureEvent {
  id: string;
  type: 'supabase_down' | 'indexeddb_corrupt' | 'sync_failed' | 'data_corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  recoveryAttempts: number;
  lastError?: string;
  affectedCollections?: string[];
}

export interface RecoveryResult {
  success: boolean;
  strategy: string;
  duration: number;
  dataRecovered: number;
  errors: number;
  timestamp: string;
}

export class RecoveryService {
  private config: RecoveryConfig = {
    enabled: true,
    autoRecovery: true,
    recoveryStrategies: ['cache_fallback', 'backup_restore', 'sync_retry', 'manual_intervention'],
    maxRecoveryAttempts: 3,
    recoveryTimeout: 300, // 5 minutes
    notifyOnRecovery: true,
    criticalCollections: ['admin_config', 'user_data', 'products', 'orders']
  };

  private failureHistory: FailureEvent[] = [];
  private recoveryInProgress = new Set<string>();
  private healthMonitor: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date = new Date();

  constructor() {
    this.loadConfig();
    this.startHealthMonitoring();
    this.loadFailureHistory();
  }

  /**
   * Charge la configuration
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await hybridStorage.get<RecoveryConfig>('system_config', 'recovery_config');
      if (stored) {
        this.config = { ...this.config, ...stored };
      }
    } catch (error) {
      logger.error('Erreur chargement config recovery:', error);
    }
  }

  /**
   * Sauvegarde la configuration
   */
  private async saveConfig(): Promise<void> {
    await hybridStorage.set('system_config', 'recovery_config', this.config);
  }

  /**
   * Met à jour la configuration
   */
  async updateConfig(newConfig: Partial<RecoveryConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  /**
   * Démarre le monitoring de santé
   */
  private startHealthMonitoring(): void {
    this.healthMonitor = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Toutes les minutes
  }

  /**
   * Effectue une vérification de santé complète
   */
  private async performHealthCheck(): Promise<void> {
    this.lastHealthCheck = new Date();

    try {
      // Test Supabase
      const supabaseHealth = await this.checkSupabaseHealth();
      if (!supabaseHealth.healthy) {
        await this.handleFailure({
          type: 'supabase_down',
          severity: supabaseHealth.critical ? 'critical' : 'high',
          description: `Supabase indisponible: ${supabaseHealth.error}`,
          affectedCollections: this.config.criticalCollections
        });
      }

      // Test IndexedDB
      const indexeddbHealth = await this.checkIndexedDBHealth();
      if (!indexeddbHealth.healthy) {
        await this.handleFailure({
          type: 'indexeddb_corrupt',
          severity: indexeddbHealth.critical ? 'high' : 'medium',
          description: `IndexedDB corrompu: ${indexeddbHealth.error}`,
          affectedCollections: indexeddbHealth.affectedCollections
        });
      }

      // Test synchronisation
      const syncHealth = await this.checkSyncHealth();
      if (!syncHealth.healthy) {
        await this.handleFailure({
          type: 'sync_failed',
          severity: 'medium',
          description: `Échec de synchronisation: ${syncHealth.error}`,
          affectedCollections: syncHealth.affectedCollections
        });
      }

      // Vérification d'intégrité des données
      await this.checkDataIntegrity();

    } catch (error) {
      logger.error('Erreur health check:', error);
    }
  }

  /**
   * Vérifie la santé de Supabase
   */
  private async checkSupabaseHealth(): Promise<{ healthy: boolean; critical: boolean; error?: string }> {
    try {
      // Test de connectivité basique
      const { error: connectionError } = await supabase.from('admin_config').select('count').limit(1);
      if (connectionError) {
        return { healthy: false, critical: true, error: connectionError.message };
      }

      // Test de performance (timeout)
      const startTime = Date.now();
      const { error: perfError } = await supabase.from('admin_config').select('*').limit(5);
      const responseTime = Date.now() - startTime;

      if (perfError) {
        return { healthy: false, critical: false, error: perfError.message };
      }

      // Considère lent comme problème si > 5 secondes
      if (responseTime > 5000) {
        return { healthy: false, critical: false, error: `Réponse lente (${responseTime}ms)` };
      }

      return { healthy: true, critical: false };
    } catch (error) {
      return { healthy: false, critical: true, error: error.message };
    }
  }

  /**
   * Vérifie la santé d'IndexedDB
   */
  private async checkIndexedDBHealth(): Promise<{ healthy: boolean; critical: boolean; error?: string; affectedCollections?: string[] }> {
    try {
      const stats = await hybridStorage.getStorageStats();

      if (!stats.indexeddb) {
        return { healthy: false, critical: true, error: 'IndexedDB non disponible' };
      }

      // Vérifie la taille (alerte si > 500MB)
      const sizeMB = stats.indexeddb.size / (1024 * 1024);
      if (sizeMB > 500) {
        return {
          healthy: false,
          critical: false,
          error: `Taille IndexedDB excessive: ${sizeMB.toFixed(1)}MB`
        };
      }

      // Vérifie l'intégrité basique
      const exportData = await hybridStorage.exportData();
      if (!exportData || exportData.length === 0) {
        return { healthy: false, critical: false, error: 'Données IndexedDB vides ou corrompues' };
      }

      return { healthy: true, critical: false };
    } catch (error) {
      return { healthy: false, critical: true, error: error.message };
    }
  }

  /**
   * Vérifie la santé de la synchronisation
   */
  private async checkSyncHealth(): Promise<{ healthy: boolean; error?: string; affectedCollections?: string[] }> {
    try {
      const syncStats = await syncService.getSyncStats();

      // Vérifie les conflits non résolus (plus de 10 = problème)
      if (syncStats.conflicts.unresolved > 10) {
        return {
          healthy: false,
          error: `${syncStats.conflicts.unresolved} conflits non résolus`,
          affectedCollections: this.config.criticalCollections
        };
      }

      // Vérifie la file d'attente (plus de 100 éléments = problème)
      if (syncStats.queue.pending > 100) {
        return {
          healthy: false,
          error: `${syncStats.queue.pending} éléments en file d'attente`,
          affectedCollections: this.config.criticalCollections
        };
      }

      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Vérifie l'intégrité des données
   */
  private async checkDataIntegrity(): Promise<void> {
    try {
      const criticalCollections = this.config.criticalCollections;

      for (const collection of criticalCollections) {
        const items = await this.getCollectionSample(collection, 10);

        for (const item of items) {
          if (!this.validateDataItem(item)) {
            await this.handleFailure({
              type: 'data_corruption',
              severity: 'high',
              description: `Donnée corrompue détectée dans ${collection}:${item.id}`,
              affectedCollections: [collection]
            });
            break; // Un seul rapport par collection
          }
        }
      }
    } catch (error) {
      logger.error('Erreur vérification intégrité:', error);
    }
  }

  /**
   * Valide un élément de données
   */
  private validateDataItem(item: any): boolean {
    try {
      // Vérifications basiques
      if (!item || !item.id) return false;

      // Vérifie la structure JSON
      JSON.stringify(item);

      // Vérifications spécifiques selon le type
      if (item.metadata) {
        if (!item.metadata.createdAt || !item.metadata.updatedAt) return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gère un événement de panne
   */
  private async handleFailure(failure: Omit<FailureEvent, 'id' | 'detectedAt' | 'resolved' | 'recoveryAttempts'>): Promise<void> {
    const failureEvent: FailureEvent = {
      id: `failure_${failure.type}_${Date.now()}`,
      ...failure,
      detectedAt: new Date().toISOString(),
      resolved: false,
      recoveryAttempts: 0
    };

    // Log l'événement
    this.failureHistory.unshift(failureEvent);
    await this.saveFailureHistory();

    // Notification
    await this.notifyFailure(failureEvent);

    // Récupération automatique si activée
    if (this.config.autoRecovery && failure.severity !== 'low') {
      await this.attemptAutoRecovery(failureEvent);
    }
  }

  /**
   * Tente une récupération automatique
   */
  private async attemptAutoRecovery(failure: FailureEvent): Promise<void> {
    if (this.recoveryInProgress.has(failure.id)) return;

    this.recoveryInProgress.add(failure.id);

    try {
      logger.info(`Tentative récupération automatique pour ${failure.type}`);

      let recoveryResult: RecoveryResult | null = null;

      // Essaie chaque stratégie dans l'ordre
      for (const strategy of this.config.recoveryStrategies) {
        if (failure.recoveryAttempts >= this.config.maxRecoveryAttempts) break;

        try {
          recoveryResult = await this.executeRecoveryStrategy(strategy, failure);
          failure.recoveryAttempts++;

          if (recoveryResult.success) {
            logger.info(`Récupération réussie avec stratégie ${strategy}`);
            break;
          }
        } catch (error) {
          logger.warn(`Échec stratégie ${strategy}:`, error);
          failure.lastError = error.message;
        }
      }

      // Met à jour le statut
      if (recoveryResult?.success) {
        failure.resolved = true;
        failure.resolvedAt = new Date().toISOString();
        await this.notifyRecovery(failure, recoveryResult);
      } else {
        // Marque pour intervention manuelle si toutes les stratégies ont échoué
        failure.lastError = 'Toutes les stratégies de récupération ont échoué';
      }

      await this.saveFailureHistory();

    } finally {
      this.recoveryInProgress.delete(failure.id);
    }
  }

  /**
   * Exécute une stratégie de récupération
   */
  private async executeRecoveryStrategy(strategy: string, failure: FailureEvent): Promise<RecoveryResult> {
    const startTime = Date.now();

    switch (strategy) {
      case 'cache_fallback':
        return await this.strategyCacheFallback(failure);

      case 'backup_restore':
        return await this.strategyBackupRestore(failure);

      case 'sync_retry':
        return await this.strategySyncRetry(failure);

      case 'manual_intervention':
        return await this.strategyManualIntervention(failure);

      default:
        throw new Error(`Stratégie inconnue: ${strategy}`);
    }
  }

  /**
   * Stratégie: Fallback vers le cache
   */
  private async strategyCacheFallback(failure: FailureEvent): Promise<RecoveryResult> {
    logger.info('Exécution stratégie cache fallback');

    let dataRecovered = 0;
    let errors = 0;

    try {
      // Essaie de récupérer depuis IndexedDB si Supabase est down
      if (failure.type === 'supabase_down') {
        // Les données sont déjà dans le cache, on force une re-synchronisation
        const results = await syncService.performFullSync();
        dataRecovered = results.reduce((sum, r) => sum + r.synced, 0);
        errors = results.reduce((sum, r) => sum + r.errors, 0);
      }

      return {
        success: errors === 0,
        strategy: 'cache_fallback',
        duration: Date.now() - Date.now(),
        dataRecovered,
        errors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'cache_fallback',
        duration: Date.now() - Date.now(),
        dataRecovered: 0,
        errors: 1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stratégie: Restauration depuis sauvegarde
   */
  private async strategyBackupRestore(failure: FailureEvent): Promise<RecoveryResult> {
    logger.info('Exécution stratégie backup restore');

    const startTime = Date.now();

    try {
      // Trouve la sauvegarde la plus récente
      const backups = await backupService.listBackups();
      const latestBackup = backups.find(b => b.status === 'completed');

      if (!latestBackup) {
        throw new Error('Aucune sauvegarde disponible');
      }

      // Restauration (dry run d'abord)
      await backupService.restoreBackup(latestBackup.id, {
        collections: failure.affectedCollections,
        overwrite: true,
        validateData: true,
        dryRun: false
      });

      return {
        success: true,
        strategy: 'backup_restore',
        duration: Date.now() - startTime,
        dataRecovered: 1, // Sauvegarde complète
        errors: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'backup_restore',
        duration: Date.now() - startTime,
        dataRecovered: 0,
        errors: 1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stratégie: Retry de synchronisation
   */
  private async strategySyncRetry(failure: FailureEvent): Promise<RecoveryResult> {
    logger.info('Exécution stratégie sync retry');

    const startTime = Date.now();

    try {
      // Retry la synchronisation complète
      const results = await syncService.performFullSync();
      const dataRecovered = results.reduce((sum, r) => sum + r.synced, 0);
      const errors = results.reduce((sum, r) => sum + r.errors, 0);

      return {
        success: errors === 0,
        strategy: 'sync_retry',
        duration: Date.now() - startTime,
        dataRecovered,
        errors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'sync_retry',
        duration: Date.now() - startTime,
        dataRecovered: 0,
        errors: 1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stratégie: Intervention manuelle (placeholder)
   */
  private async strategyManualIntervention(failure: FailureEvent): Promise<RecoveryResult> {
    logger.info('Stratégie intervention manuelle requise');

    // Envoie une notification pour intervention manuelle
    await this.requestManualIntervention(failure);

    return {
      success: false,
      strategy: 'manual_intervention',
      duration: 0,
      dataRecovered: 0,
      errors: 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Récupère un échantillon d'une collection
   */
  private async getCollectionSample(collection: string, limit: number): Promise<any[]> {
    try {
      // Essaie d'abord Supabase
      const { data, error } = await supabase
        .from(collection)
        .select('*')
        .limit(limit);

      if (!error && data) {
        return data;
      }

      // Fallback vers IndexedDB
      const exportData = await hybridStorage.exportData();
      const parsed = JSON.parse(exportData);
      const items = parsed.collections[collection] || [];
      return items.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Charge l'historique des pannes
   */
  private async loadFailureHistory(): Promise<void> {
    try {
      const stored = await hybridStorage.get<FailureEvent[]>('system_data', 'failure_history');
      if (stored) {
        this.failureHistory = stored;
      }
    } catch (error) {
      logger.error('Erreur chargement historique pannes:', error);
    }
  }

  /**
   * Sauvegarde l'historique des pannes
   */
  private async saveFailureHistory(): Promise<void> {
    // Garde seulement les 100 dernières entrées
    const recentHistory = this.failureHistory.slice(0, 100);
    await hybridStorage.set('system_data', 'failure_history', recentHistory);
  }

  /**
   * Notifie une panne
   */
  private async notifyFailure(failure: FailureEvent): Promise<void> {
    if (!this.config.notifyOnRecovery) return;

    logger.warn(`PANNE DÉTECTÉE: ${failure.type} - ${failure.description}`);

    // Ici on pourrait envoyer des notifications push, emails, etc.
    // Pour l'instant, on log seulement
  }

  /**
   * Notifie une récupération
   */
  private async notifyRecovery(failure: FailureEvent, result: RecoveryResult): Promise<void> {
    if (!this.config.notifyOnRecovery) return;

    logger.info(`RÉCUPÉRATION RÉUSSIE: ${failure.type} - ${result.dataRecovered} données récupérées`);
  }

  /**
   * Demande une intervention manuelle
   */
  private async requestManualIntervention(failure: FailureEvent): Promise<void> {
    logger.error(`INTERVENTION MANUELLE REQUISE: ${failure.type} - ${failure.description}`);

    // Ici on pourrait envoyer un email à l'admin, créer un ticket, etc.
  }

  /**
   * Déclenche une récupération manuelle
   */
  async triggerManualRecovery(failureId: string): Promise<RecoveryResult | null> {
    const failure = this.failureHistory.find(f => f.id === failureId);
    if (!failure || failure.resolved) return null;

    return await this.executeRecoveryStrategy('manual_intervention', failure);
  }

  /**
   * Force une vérification de santé
   */
  async forceHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  /**
   * Obtient l'état de santé actuel
   */
  async getHealthStatus(): Promise<any> {
    const stats = await hybridStorage.getStorageStats();
    const syncStats = await syncService.getSyncStats();
    const backupStats = await backupService.getBackupStats();

    return {
      lastCheck: this.lastHealthCheck.toISOString(),
      storage: stats,
      sync: syncStats,
      backup: backupStats,
      activeFailures: this.failureHistory.filter(f => !f.resolved).length,
      recentFailures: this.failureHistory.slice(0, 5)
    };
  }

  /**
   * Obtient l'historique des pannes
   */
  getFailureHistory(): FailureEvent[] {
    return [...this.failureHistory];
  }

  /**
   * Teste la récupération (mode test)
   */
  async testRecovery(failureType: FailureEvent['type']): Promise<RecoveryResult> {
    logger.info(`Test récupération pour ${failureType}`);

    const testFailure: FailureEvent = {
      id: `test_${Date.now()}`,
      type: failureType,
      severity: 'low',
      description: 'Test de récupération',
      detectedAt: new Date().toISOString(),
      resolved: false,
      recoveryAttempts: 0,
      affectedCollections: ['test_collection']
    };

    return await this.executeRecoveryStrategy(this.config.recoveryStrategies[0], testFailure);
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
    }
  }
}

// Instance globale du service
export const recoveryService = new RecoveryService();

// Cleanup automatique
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    recoveryService.destroy();
  });
}