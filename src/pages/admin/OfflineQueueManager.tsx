/**
 * Page d'administration pour gérer la queue offline
 * Permet de voir et gérer les actions en attente de synchronisation
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { localQueue, LocalAction } from '@/lib/localQueue';
import { syncService } from '@/services/syncService';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const OfflineQueueManager = () => {
  const { toast } = useToast();
  const { isOffline, isBackendDown, forceSync, retryFailed } = useOfflineMode();

  const [queueItems, setQueueItems] = useState<LocalAction[]>([]);
  const [queueStats, setQueueStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<LocalAction | null>(null);

  // Charger les données de la queue
  const loadQueueData = async () => {
    try {
      setLoading(true);
      const [items, stats] = await Promise.all([
        localQueue.getPendingActions(100), // 100 éléments max pour l'affichage
        localQueue.getQueueStats()
      ]);

      setQueueItems(items);
      setQueueStats(stats);
    } catch (error) {
      logger.error('Erreur chargement queue:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(loadQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Synchronisation manuelle
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await forceSync();
      await loadQueueData();
    } finally {
      setSyncing(false);
    }
  };

  // Retry des actions échouées
  const handleRetryFailed = async () => {
    try {
      await retryFailed();
      await loadQueueData();
      toast({
        title: "Retry lancé",
        description: "Tentative de synchronisation des actions échouées",
      });
    } catch (error) {
      toast({
        title: "Erreur retry",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Supprimer une action
  const handleDeleteAction = async (actionId: string) => {
    try {
      await localQueue.deleteAction(actionId);
      await loadQueueData();
      toast({
        title: "Action supprimée",
        description: "L'action a été retirée de la queue",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'action",
        variant: "destructive"
      });
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Badge pour le type d'action
  const getActionTypeBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      create_order: 'bg-blue-100 text-blue-800',
      update_product: 'bg-green-100 text-green-800',
      add_to_cart: 'bg-purple-100 text-purple-800',
      create_store: 'bg-orange-100 text-orange-800',
      update_store: 'bg-orange-100 text-orange-800',
      create_user: 'bg-red-100 text-red-800',
      update_user: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[actionType] || 'bg-gray-100 text-gray-800'}>
        {actionType.replace('_', ' ')}
      </Badge>
    );
  };

  // Badge pour la priorité
  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return <Badge variant="destructive">Critique</Badge>;
    if (priority >= 4) return <Badge className="bg-orange-100 text-orange-800">Haute</Badge>;
    if (priority >= 3) return <Badge className="bg-yellow-100 text-yellow-800">Normale</Badge>;
    return <Badge variant="outline">Basse</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion de la Queue Offline</h1>
            <p className="text-muted-foreground">
              Surveillez et gérez les actions en attente de synchronisation
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Statut de connectivité */}
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WifiOff className="h-4 w-4 text-red-600" />
              ) : isBackendDown ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <Wifi className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm">
                {isOffline ? 'Hors ligne' : isBackendDown ? 'Backend indisponible' : 'En ligne'}
              </span>
            </div>

            <Button
              onClick={handleManualSync}
              disabled={isOffline || syncing || queueStats.pending === 0}
              variant="outline"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Synchroniser ({queueStats.pending || 0})
            </Button>
          </div>
        </div>

        {/* Alertes */}
        {isOffline && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Mode hors ligne détecté</AlertTitle>
            <AlertDescription>
              Les actions sont stockées localement et seront synchronisées automatiquement
              dès que la connexion sera rétablie.
            </AlertDescription>
          </Alert>
        )}

        {isBackendDown && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Backend indisponible</AlertTitle>
            <AlertDescription>
              Le serveur est temporairement inaccessible. Les actions sont mises en queue
              et seront synchronisées automatiquement.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{queueStats.total || 0}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{queueStats.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Synchronisées</p>
                  <p className="text-2xl font-bold text-green-600">{queueStats.synced || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Échouées</p>
                  <p className="text-2xl font-bold text-red-600">{queueStats.failed || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions de gestion */}
        {queueStats.failed > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Actions de récupération</CardTitle>
              <CardDescription>
                {queueStats.failed} action(s) ont échoué lors de la synchronisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={handleRetryFailed} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retenter les échecs
                </Button>
                <Button
                  onClick={() => localQueue.cleanupFailedActions(1)} // Nettoyer les actions de plus d'1h
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Nettoyer les anciennes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des actions en attente */}
        <Card>
          <CardHeader>
            <CardTitle>Actions en attente</CardTitle>
            <CardDescription>
              Liste des actions stockées localement en attente de synchronisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p>Aucune action en attente</p>
                <p className="text-sm">Toutes les actions ont été synchronisées</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Créée</TableHead>
                    <TableHead>Retry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>{getActionTypeBadge(action.action_type)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {action.store_id.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>{getPriorityBadge(action.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(action.created_at)}
                      </TableCell>
                      <TableCell>
                        {action.retry_count > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            {action.retry_count}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAction(action)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails de l'action</DialogTitle>
                                <DialogDescription>
                                  Action créée le {formatDate(action.created_at)}
                                </DialogDescription>
                              </DialogHeader>

                              {selectedAction && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Type:</strong> {selectedAction.action_type}
                                    </div>
                                    <div>
                                      <strong>Priorité:</strong> {selectedAction.priority}
                                    </div>
                                    <div>
                                      <strong>Boutique:</strong> {selectedAction.store_id}
                                    </div>
                                    <div>
                                      <strong>Retry:</strong> {selectedAction.retry_count}
                                    </div>
                                  </div>

                                  <div>
                                    <strong>Payload:</strong>
                                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-40">
                                      {JSON.stringify(selectedAction.payload, null, 2)}
                                    </pre>
                                  </div>

                                  {selectedAction.last_error && (
                                    <div>
                                      <strong className="text-red-600">Dernière erreur:</strong>
                                      <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">
                                        {selectedAction.last_error}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAction(action.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Statistiques par type */}
        {queueStats.byType && Object.keys(queueStats.byType).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type d'action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(queueStats.byType).map(([type, count]) => (
                  <div key={type} className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold">{count as number}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {type.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default OfflineQueueManager;