/**
 * Composant de statut offline avec contrôles de synchronisation
 * Affiche l'état de connectivité et permet la gestion manuelle
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Zap
} from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { syncService } from '@/services/syncService';
import { logger } from '@/lib/logger';

interface OfflineStatusProps {
  showQueueStats?: boolean;
  compact?: boolean;
}

export const OfflineStatus = ({ showQueueStats = true, compact = false }: OfflineStatusProps) => {
  const {
    isOffline,
    isBackendDown,
    pendingActions,
    lastSyncTime,
    connectionStatus,
    forceSync,
    retryFailed,
    updateQueueStats
  } = useOfflineMode();

  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Met à jour le statut de sync périodiquement
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await syncService.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        logger.error('Erreur récupération statut sync:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Toutes les 10 secondes
    return () => clearInterval(interval);
  }, []);

  // Handler pour la synchronisation forcée
  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await forceSync();
      await updateQueueStats();
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour retry des échecs
  const handleRetryFailed = async () => {
    setIsLoading(true);
    try {
      await retryFailed();
      await updateQueueStats();
    } finally {
      setIsLoading(false);
    }
  };

  // Badge de statut
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'online':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Wifi className="w-3 h-3 mr-1" />
            En ligne
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="destructive">
            <WifiOff className="w-3 h-3 mr-1" />
            Hors ligne
          </Badge>
        );
      case 'backend_down':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Backend indisponible
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Synchronisation
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Inconnu
          </Badge>
        );
    }
  };

  // Formatage de la dernière sync
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Jamais';

    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  // Mode compact (pour header/navbar)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}

        {pendingActions > 0 && (
          <Badge variant="outline" className="bg-yellow-50">
            <Database className="w-3 h-3 mr-1" />
            {pendingActions} en attente
          </Badge>
        )}

        {connectionStatus !== 'online' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleForceSync}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Mode complet
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Statut de Synchronisation
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          État de la connectivité et de la synchronisation des données
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alertes d'état */}
        {connectionStatus === 'offline' && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Hors ligne</AlertTitle>
            <AlertDescription>
              Vous êtes actuellement hors ligne. Les actions seront synchronisées automatiquement à la reconnexion.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'backend_down' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Service indisponible</AlertTitle>
            <AlertDescription>
              Le serveur est temporairement indisponible. Vos actions sont enregistrées localement et seront synchronisées automatiquement.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'syncing' && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertTitle>Synchronisation en cours</AlertTitle>
            <AlertDescription>
              Synchronisation des données locales en cours...
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pendingActions}</div>
            <p className="text-sm text-muted-foreground">Actions en attente</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {syncStatus?.queue?.synced || 0}
            </div>
            <p className="text-sm text-muted-foreground">Synchronisées</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {syncStatus?.queue?.failed || 0}
            </div>
            <p className="text-sm text-muted-foreground">Échouées</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Dernière sync</div>
            <p className="text-xs text-muted-foreground">{formatLastSync()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleForceSync}
            disabled={connectionStatus === 'offline' || isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Forcer la synchronisation
          </Button>

          {(syncStatus?.queue?.failed || 0) > 0 && (
            <Button
              onClick={handleRetryFailed}
              disabled={connectionStatus !== 'online' || isLoading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retenter les échecs ({syncStatus?.queue?.failed || 0})
            </Button>
          )}
        </div>

        {/* Statistiques détaillées */}
        {showQueueStats && syncStatus && (
          <div className="space-y-2">
            <h4 className="font-medium">Répartition par type d'action</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(syncStatus.queue?.byType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message informatif */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <strong>Sécurité garantie :</strong> Toutes les données locales sont chiffrées
            et validées par le serveur avant application.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};