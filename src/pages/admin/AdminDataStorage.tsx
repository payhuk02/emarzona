import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Database,
  HardDrive,
  Cloud,
  Sync,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Activity,
  Archive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { hybridStorage } from '@/lib/storage/hybrid-storage-service';
import { backupService } from '@/lib/storage/backup-service';
import { syncService } from '@/lib/storage/sync-service';
import { recoveryService } from '@/lib/storage/recovery-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Interfaces pour les données
interface SyncActivity {
  collection: string;
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

interface FailureEvent {
  id: string;
  type: string;
  severity: string;
  description: string;
  detectedAt: string;
  resolved: boolean;
  recoveryAttempts: number;
}

const AdminDataStorage = () => {
  const { toast } = useToast();

  // États
  const [storageStats, setStorageStats] = useState<Record<string, unknown>>({});
  const [backupStats, setBackupStats] = useState<Record<string, unknown>>({});
  const [syncStats, setSyncStats] = useState<Record<string, unknown>>({});
  const [healthStatus, setHealthStatus] = useState<Record<string, unknown>>({});
  const [_loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  // Chargement des données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, backup, sync, health] = await Promise.all([
        hybridStorage.getStorageStats(),
        backupService.getBackupStats(),
        syncService.getSyncStats(),
        recoveryService.getHealthStatus()
      ]);

      setStorageStats(stats);
      setBackupStats(backup);
      setSyncStats(sync);
      setHealthStatus(health);
    } catch (error) {
      logger.error('Erreur chargement données stockage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de stockage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Chargement initial des données
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh toutes les 30 secondes
    return () => clearInterval(interval);
  }, [loadData]);


  // Actions principales
  const handleFullSync = async () => {
    setSyncInProgress(true);
    try {
      const results = await syncService.performFullSync();
      const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      toast({
        title: "Synchronisation terminée",
        description: `${totalSynced} éléments synchronisés, ${totalErrors} erreurs`,
        variant: totalErrors > 0 ? "destructive" : "default"
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleManualBackup = async () => {
    setBackupInProgress(true);
    try {
      const backupId = await backupService.createManualBackup(
        `Sauvegarde manuelle ${new Date().toLocaleString('fr-FR')}`,
        'Créée depuis l\'interface d\'administration'
      );

      toast({
        title: "Sauvegarde créée",
        description: `Sauvegarde ${backupId} créée avec succès`,
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleEmergencyBackup = async () => {
    try {
      const backupId = await backupService.createEmergencyBackup(
        'Sauvegarde d\'urgence demandée depuis l\'administration'
      );

      toast({
        title: "Sauvegarde d'urgence créée",
        description: `Sauvegarde ${backupId} créée`,
        variant: "destructive"
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Erreur sauvegarde d'urgence",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthBadge = (system: string, status: boolean | undefined) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {system}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Administration du Stockage</h1>
            <p className="text-muted-foreground">
              Gestion avancée des données avec résilience et synchronisation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFullSync}
              disabled={syncInProgress}
              variant="outline"
            >
              {syncInProgress ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sync className="w-4 h-4 mr-2" />
              )}
              Sync Complète
            </Button>
            <Button
              onClick={handleManualBackup}
              disabled={backupInProgress}
              variant="outline"
            >
              {backupInProgress ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              Sauvegarde
            </Button>
            <Button
              onClick={handleEmergencyBackup}
              variant="destructive"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Urgence
            </Button>
          </div>
        </div>

        {/* Alertes de santé */}
        {healthStatus.activeFailures > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problèmes détectés</AlertTitle>
            <AlertDescription>
              {healthStatus.activeFailures} problème(s) actif(s) détecté(s).
              Vérifiez l'onglet Santé pour plus de détails.
            </AlertDescription>
          </Alert>
        )}

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="storage">Stockage</TabsTrigger>
            <TabsTrigger value="sync">Synchronisation</TabsTrigger>
            <TabsTrigger value="backup">Sauvegarde</TabsTrigger>
            <TabsTrigger value="health">Santé</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Données</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes((storageStats.indexeddb?.size || 0) + (storageStats.localstorage?.size || 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    IndexedDB + localStorage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">État Sync</CardTitle>
                  <Sync className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {syncStats.queue?.pending || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En attente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sauvegardes</CardTitle>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {backupStats.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total disponibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthStatus.storage?.supabase?.available &&
                     healthStatus.storage?.indexeddb ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {healthStatus.activeFailures || 0} problème(s)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* État des systèmes */}
            <Card>
              <CardHeader>
                <CardTitle>État des Systèmes</CardTitle>
                <CardDescription>
                  Statut en temps réel des différents systèmes de stockage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      <span>Supabase</span>
                    </div>
                    {getHealthBadge('En ligne', healthStatus.storage?.supabase?.available)}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      <span>IndexedDB</span>
                    </div>
                    {getHealthBadge('Opérationnel', !!healthStatus.storage?.indexeddb)}
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <span>localStorage</span>
                    </div>
                    {getHealthBadge('Disponible', !!healthStatus.storage?.localstorage)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Stockage */}
          <TabsContent value="storage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* IndexedDB */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    IndexedDB Local
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Collections</span>
                    <Badge>{storageStats.indexeddb?.collections || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Éléments totaux</span>
                    <Badge>{storageStats.indexeddb?.items || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Taille</span>
                    <Badge>{formatBytes(storageStats.indexeddb?.size || 0)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{((storageStats.indexeddb?.size || 0) / (500 * 1024 * 1024) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(storageStats.indexeddb?.size || 0) / (500 * 1024 * 1024) * 100} />
                  </div>
                </CardContent>
              </Card>

              {/* localStorage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    localStorage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Éléments</span>
                    <Badge>{storageStats.localstorage?.items || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Taille</span>
                    <Badge>{formatBytes(storageStats.localstorage?.size || 0)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{((storageStats.localstorage?.size || 0) / (10 * 1024 * 1024) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(storageStats.localstorage?.size || 0) / (10 * 1024 * 1024) * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions de stockage */}
            <Card>
              <CardHeader>
                <CardTitle>Actions de Stockage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter Données
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Importer Données
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nettoyer Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Synchronisation */}
          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statut de Synchronisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {syncStats.queue?.pending || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {syncStats.conflicts?.unresolved || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Conflits</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {syncStats.queue?.failed || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Échoués</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle>Activité Récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncStats.recentActivity?.slice(0, 5).map((activity: SyncActivity, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>{activity.collection}</span>
                      <div className="flex gap-2">
                        <Badge variant={activity.success ? "default" : "destructive"}>
                          {activity.synced || 0} sync
                        </Badge>
                        <Badge variant="outline">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">Aucune activité récente</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Sauvegarde */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Sauvegardes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{backupStats.total || 0}</div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {backupStats.byType?.automatic || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Automatiques</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {backupStats.byType?.manual || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Manuelles</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {backupStats.byType?.emergency || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Urgences</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions de sauvegarde */}
            <Card>
              <CardHeader>
                <CardTitle>Actions de Sauvegarde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger Sauvegarde
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Restaurer Sauvegarde
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Santé */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>État de Santé du Système</CardTitle>
                <CardDescription>
                  Dernière vérification: {new Date(healthStatus.lastCheck).toLocaleString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Indicateurs de santé */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {healthStatus.storage?.supabase?.available ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-600" />
                      )}
                      <span>Connexion Supabase</span>
                    </div>
                    <Badge variant={healthStatus.storage?.supabase?.available ? "default" : "destructive"}>
                      {healthStatus.storage?.supabase?.available ? "OK" : "HS"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-blue-600" />
                      <span>IndexedDB</span>
                    </div>
                    <Badge variant={healthStatus.storage?.indexeddb ? "default" : "destructive"}>
                      {healthStatus.storage?.indexeddb ? "OK" : "HS"}
                    </Badge>
                  </div>
                </div>

                {/* Problèmes actifs */}
                {healthStatus.recentFailures?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Problèmes récents</h4>
                    {healthStatus.recentFailures?.map((failure: FailureEvent, index: number) => (
                      <Alert key={index} variant={failure.resolved ? "default" : "destructive"}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{failure.type}</AlertTitle>
                        <AlertDescription>{failure.description}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions de maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Vérification Santé
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    Logs Système
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDataStorage;