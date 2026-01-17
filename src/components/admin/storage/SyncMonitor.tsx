import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sync,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';
import { syncService } from '@/lib/storage/sync-service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ConflictResolution {
  id: string;
  collection: string;
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolved: boolean;
  timestamp: string;
}

interface SyncResult {
  collection: string;
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

interface SyncMonitorProps {
  onSyncComplete?: () => void;
}

export const SyncMonitor = ({ onSyncComplete }: SyncMonitorProps) => {
  const { toast } = useToast();
  const [syncStats, setSyncStats] = useState<Record<string, unknown>>({});
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConflictsDialog, setShowConflictsDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictResolution | null>(null);

  // Chargement des données
  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, unresolvedConflicts] = await Promise.all([
        syncService.getSyncStats(),
        syncService.getUnresolvedConflicts()
      ]);

      setSyncStats(stats);
      setConflicts(unresolvedConflicts);
    } catch (error) {
      logger.error('Erreur chargement données sync:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Toutes les 10 secondes
    return () => clearInterval(interval);
  }, []);

  // Synchronisation complète
  const handleFullSync = async () => {
    setSyncing(true);
    try {
      const results = await syncService.performFullSync();
      setSyncResults(results);

      const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
      const totalConflicts = results.reduce((sum, r) => sum + r.conflicts, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      toast({
        title: "Synchronisation terminée",
        description: `${totalSynced} synchronisés, ${totalConflicts} conflits, ${totalErrors} erreurs`,
        variant: totalErrors > 0 ? "destructive" : "default"
      });

      await loadData();
      onSyncComplete?.();

    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Résoudre un conflit
  const handleResolveConflict = async (conflictId: string, strategy: 'local' | 'remote' | 'merge') => {
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      conflict.strategy = strategy;
      await syncService.resolveConflict(conflict);

      toast({
        title: "Conflit résolu",
        description: `Résolu avec stratégie: ${strategy}`,
      });

      await loadData();
      setSelectedConflict(null);

    } catch (error) {
      toast({
        title: "Erreur résolution conflit",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Obtenir le statut de connectivité
  const getConnectivityStatus = (): boolean => {
    // Cette logique pourrait être améliorée avec un vrai monitoring
    return navigator.onLine;
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Monitoring de Synchronisation</h3>
          <p className="text-sm text-muted-foreground">
            Surveillez et gérez la synchronisation des données
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Statut de connectivité */}
          <div className="flex items-center gap-2">
            {getConnectivityStatus() ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {getConnectivityStatus() ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>

          <Button
            onClick={handleFullSync}
            disabled={syncing || !getConnectivityStatus()}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sync className="w-4 h-4 mr-2" />
            )}
            Sync Complète
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {syncStats.queue?.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conflits</p>
                <p className="text-2xl font-bold text-red-600">
                  {syncStats.conflicts?.unresolved || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">
                  {syncStats.queue?.failed || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière sync</p>
                <p className="text-sm font-medium">
                  {syncStats.lastFullSync ?
                    new Date(syncStats.lastFullSync).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) :
                    'Jamais'
                  }
                </p>
              </div>
              <Sync className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {syncStats.conflicts?.unresolved > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflits de synchronisation détectés</AlertTitle>
          <AlertDescription>
            {syncStats.conflicts.unresolved} conflit(s) non résolu(s) nécessite(nt) votre attention.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setShowConflictsDialog(true)}
            >
              Voir les conflits
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Activité récente de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle>Activité de Synchronisation Récente</CardTitle>
          <CardDescription>
            Résultats des dernières opérations de synchronisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune activité récente
            </div>
          ) : (
            <div className="space-y-4">
              {syncResults.slice(0, 10).map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.collection}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-green-600">{result.synced}</p>
                      <p className="text-muted-foreground">Sync</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-yellow-600">{result.conflicts}</p>
                      <p className="text-muted-foreground">Conflits</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-red-600">{result.errors}</p>
                      <p className="text-muted-foreground">Erreurs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{result.duration}ms</p>
                      <p className="text-muted-foreground">Durée</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog des conflits */}
      <Dialog open={showConflictsDialog} onOpenChange={setShowConflictsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conflits de Synchronisation</DialogTitle>
            <DialogDescription>
              Résolvez les conflits entre les versions locales et distantes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {conflicts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun conflit non résolu
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection</TableHead>
                    <TableHead>Détecté</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>
                        <Badge variant="outline">{conflict.collection}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(conflict.timestamp).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedConflict(conflict)}
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                Résoudre
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Résoudre le Conflit</DialogTitle>
                                <DialogDescription>
                                  Choisissez comment résoudre ce conflit de synchronisation
                                </DialogDescription>
                              </DialogHeader>

                              {selectedConflict && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Version Locale</h4>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(selectedConflict.local.data, null, 2)}
                                    </pre>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Version Distante</h4>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(selectedConflict.remote.data, null, 2)}
                                    </pre>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveConflict(selectedConflict.id, 'local')}
                                    >
                                      Garder Local
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveConflict(selectedConflict.id, 'remote')}
                                    >
                                      Garder Distant
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveConflict(selectedConflict.id, 'merge')}
                                    >
                                      Fusionner
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};