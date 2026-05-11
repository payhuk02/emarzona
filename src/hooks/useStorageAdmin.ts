/**
 * Hook pour la gestion administrative du stockage
 * Fournit une interface réactive pour monitorer et contrôler le système de stockage
 */

import { useState, useEffect, useCallback } from 'react';
import { hybridStorage } from '@/lib/storage/hybrid-storage-service';
import { backupService } from '@/lib/storage/backup-service';
import { syncService } from '@/lib/storage/sync-service';
import { recoveryService } from '@/lib/storage/recovery-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface StorageHealth {
  supabase: boolean;
  indexeddb: boolean;
  localstorage: boolean;
  lastCheck: string;
}

interface StorageMetrics {
  totalSize: number;
  collectionsCount: number;
  itemsCount: number;
  syncPending: number;
  conflictsCount: number;
  backupsCount: number;
}

interface StorageAdminState {
  health: StorageHealth;
  metrics: StorageMetrics;
  loading: boolean;
  lastUpdate: string;
}

export const useStorageAdmin = () => {
  const { toast } = useToast();
  const [state, setState] = useState<StorageAdminState>({
    health: {
      supabase: false,
      indexeddb: false,
      localstorage: false,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      totalSize: 0,
      collectionsCount: 0,
      itemsCount: 0,
      syncPending: 0,
      conflictsCount: 0,
      backupsCount: 0
    },
    loading: true,
    lastUpdate: new Date().toISOString()
  });

  // Mise à jour des métriques
  const updateMetrics = useCallback(async () => {
    try {
      const [storageStats, syncStats, backupStats, healthStatus] = await Promise.all([
        hybridStorage.getStorageStats(),
        syncService.getSyncStats(),
        backupService.getBackupStats(),
        recoveryService.getHealthStatus()
      ]);

      const totalSize = (storageStats.indexeddb?.size || 0) + (storageStats.localstorage?.size || 0);

      setState(prev => ({
        ...prev,
        health: {
          supabase: healthStatus.storage?.supabase?.available || false,
          indexeddb: !!healthStatus.storage?.indexeddb,
          localstorage: !!healthStatus.storage?.localstorage,
          lastCheck: new Date().toISOString()
        },
        metrics: {
          totalSize,
          collectionsCount: storageStats.indexeddb?.collections || 0,
          itemsCount: storageStats.indexeddb?.items || 0,
          syncPending: syncStats.queue?.pending || 0,
          conflictsCount: syncStats.conflicts?.unresolved || 0,
          backupsCount: backupStats.total || 0
        },
        loading: false,
        lastUpdate: new Date().toISOString()
      }));

    } catch (error) {
      logger.error('Erreur mise à jour métriques stockage:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Chargement initial et refresh périodique
  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Actions de stockage
  const performFullSync = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const results = await syncService.performFullSync();
      const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      toast({
        title: "Synchronisation terminée",
        description: `${totalSynced} éléments synchronisés, ${totalErrors} erreurs`,
        variant: totalErrors > 0 ? "destructive" : "default"
      });

      await updateMetrics();
      return { success: true, results };

    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  const createManualBackup = useCallback(async (name?: string, description?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const backupId = await backupService.createManualBackup(
        name || `Sauvegarde manuelle ${new Date().toLocaleString('fr-FR')}`,
        description || 'Créée depuis l\'interface d\'administration'
      );

      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde ${backupId} créée avec succès`,
      });

      await updateMetrics();
      return { success: true, backupId };

    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  const createEmergencyBackup = useCallback(async (reason: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const backupId = await backupService.createEmergencyBackup(reason);

      toast({
        title: "Sauvegarde d'urgence créée",
        description: `Sauvegarde ${backupId} créée en raison: ${reason}`,
        variant: "destructive"
      });

      await updateMetrics();
      return { success: true, backupId };

    } catch (error) {
      toast({
        title: "Erreur sauvegarde d'urgence",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  const exportData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const data = await hybridStorage.exportData();

      // Créer le fichier de téléchargement
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `emarzona_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les données ont été téléchargées",
      });

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };

    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast]);

  const importData = useCallback(async (file: File) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await backupService.importBackupFromFile(file);

      toast({
        title: "Import réussi",
        description: "Les données ont été importées",
      });

      await updateMetrics();
      return { success: true };

    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  const clearCache = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Nettoyer le cache local (simplifié)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Nettoyer localStorage des clés temporaires
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('cache_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      toast({
        title: "Cache nettoyé",
        description: "Le cache a été vidé avec succès",
      });

      await updateMetrics();
      return { success: true };

    } catch (error) {
      toast({
        title: "Erreur nettoyage cache",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  const forceHealthCheck = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await recoveryService.forceHealthCheck();

      toast({
        title: "Vérification santé terminée",
        description: "Le système a été vérifié",
      });

      await updateMetrics();
      return { success: true };

    } catch (error) {
      toast({
        title: "Erreur vérification santé",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, updateMetrics]);

  // Test de résilience (pour développement/test)
  const testResilience = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Simuler une panne Supabase
      logger.info('Test de résilience: simulation panne Supabase');

      // Créer une sauvegarde d'urgence automatiquement
      await createEmergencyBackup('Test de résilience - simulation panne');

      // Tester la récupération
      const recoveryResult = await recoveryService.testRecovery('supabase_down');

      toast({
        title: "Test de résilience terminé",
        description: `Récupération: ${recoveryResult.success ? 'Réussie' : 'Échouée'}`,
        variant: recoveryResult.success ? "default" : "destructive"
      });

      await updateMetrics();
      return { success: true, recoveryResult };

    } catch (error) {
      toast({
        title: "Erreur test résilience",
        description: error.message,
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  }, [toast, createEmergencyBackup, updateMetrics]);

  return {
    // État
    ...state,

    // Actions
    performFullSync,
    createManualBackup,
    createEmergencyBackup,
    exportData,
    importData,
    clearCache,
    forceHealthCheck,
    testResilience,

    // Utilitaires
    updateMetrics,
    formatBytes: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  };
};

export { useStorageAdmin };