/**
 * Dashboard de monitoring des erreurs
 * Affiche les erreurs récentes, les statistiques, et permet de filtrer par type/niveau
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getErrorLogs, clearErrorLogs, ErrorLog } from '@/lib/error-logger';
import { AlertCircle, RefreshCw, Trash2, Filter, Search, TrendingUp, AlertTriangle, Info, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { DataTableErrorBoundary } from '@/components/errors/DataTableErrorBoundary';

export default function AdminErrorMonitoring() {
  const isMobile = useIsMobile();
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  // Charger les logs d'erreur
  const loadErrorLogs = () => {
    try {
      const logs = getErrorLogs();
      setErrorLogs(logs);
      setFilteredLogs(logs);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading error logs:', error);
      setLoading(false);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les logs d\'erreur',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadErrorLogs();
  }, []);

  // Filtrer les logs
  useEffect(() => {
    let  filtered= [...errorLogs];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((log) => {
        return (
          log.error.message.toLowerCase().includes(query) ||
          log.error.name.toLowerCase().includes(query) ||
          log.url.toLowerCase().includes(query) ||
          (log.context.userId && log.context.userId.toLowerCase().includes(query))
        );
      });
    }

    // Filtre par niveau
    if (levelFilter !== 'all') {
      filtered = filtered.filter((log) => log.context.level === levelFilter);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((log) => {
        if (typeFilter === 'network') {
          return log.error.name === 'NetworkError';
        }
        if (typeFilter === 'validation') {
          return log.error.message.includes('validation') || log.error.message.includes('Validation');
        }
        if (typeFilter === 'api') {
          return log.error.message.includes('API') || log.error.message.includes('api');
        }
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [errorLogs, searchQuery, levelFilter, typeFilter]);

  // Statistiques
  const stats = useMemo(() => {
    const total = errorLogs.length;
    const byLevel = errorLogs.reduce((acc, log) => {
      const level = log.context.level || 'component';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = errorLogs.reduce((acc, log) => {
      let  type= 'other';
      if (log.error.name === 'NetworkError') type = 'network';
      else if (log.error.message.includes('validation') || log.error.message.includes('Validation')) type = 'validation';
      else if (log.error.message.includes('API') || log.error.message.includes('api')) type = 'api';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = errorLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logDate > dayAgo;
    }).length;

    return {
      total,
      byLevel,
      byType,
      recent,
    };
  }, [errorLogs]);

  // Vider les logs
  const handleClearLogs = () => {
    try {
      clearErrorLogs();
      setErrorLogs([]);
      setFilteredLogs([]);
      toast({
        title: 'Succès',
        description: 'Les logs d\'erreur ont été vidés',
      });
    } catch (error) {
      logger.error('Error clearing error logs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de vider les logs d\'erreur',
        variant: 'destructive',
      });
    }
  };

  // Obtenir l'icône selon le niveau
  const getLevelIcon = (level?: string) => {
    switch (level) {
      case 'app':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'page':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'section':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Obtenir la couleur du badge selon le niveau
  const getLevelBadgeVariant = (level?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'app':
        return 'destructive';
      case 'page':
        return 'default';
      case 'section':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring des Erreurs</h1>
          <p className="text-muted-foreground mt-2">
            Surveillez et analysez les erreurs de l'application
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadErrorLogs} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="destructive" onClick={handleClearLogs} className="min-h-[44px]">
            <Trash2 className="h-4 w-4 mr-2" />
            Vider les logs
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total d'erreurs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recent} dans les dernières 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs App</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byLevel.app || 0}</div>
            <p className="text-xs text-muted-foreground">
              Erreurs critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs Page</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byLevel.page || 0}</div>
            <p className="text-xs text-muted-foreground">
              Erreurs de page
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs Réseau</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.network || 0}</div>
            <p className="text-xs text-muted-foreground">
              Erreurs de connexion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrez les erreurs par critères</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="component">Component</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="network">Réseau</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des erreurs */}
      <DataTableErrorBoundary tableName="Error Monitoring">
        <Card>
          <CardHeader>
            <CardTitle>Logs d'erreur</CardTitle>
            <CardDescription>
              {filteredLogs.length} erreur(s) affichée(s) sur {errorLogs.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucune erreur</AlertTitle>
                <AlertDescription>
                  Aucune erreur ne correspond aux critères de filtrage.
                </AlertDescription>
              </Alert>
            ) : (
              isMobile ? (
                <MobileTableCard
                  data={filteredLogs.map((log, index) => ({ ...log, id: `log-${index}` }))}
                  columns={[
                    {
                      key: 'timestamp',
                      label: 'Timestamp',
                      priority: 'high',
                      render: (row: ErrorLog) => (
                        <span className="font-mono text-xs">
                          {new Date(row.timestamp).toLocaleString('fr-FR')}
                        </span>
                      ),
                    },
                    {
                      key: 'level',
                      label: 'Niveau',
                      priority: 'high',
                      render: (row: ErrorLog) => (
                        <Badge variant={getLevelBadgeVariant(row.context.level)}>
                          {getLevelIcon(row.context.level)}
                          <span className="ml-1">{row.context.level || 'component'}</span>
                        </Badge>
                      ),
                    },
                    {
                      key: 'type',
                      label: 'Type',
                      priority: 'high',
                      render: (row: ErrorLog) => (
                        <Badge variant="outline">{row.error.name}</Badge>
                      ),
                    },
                    {
                      key: 'message',
                      label: 'Message',
                      priority: 'high',
                      render: (row: ErrorLog) => (
                        <div className="truncate text-xs" title={row.error.message}>
                          {row.error.message}
                        </div>
                      ),
                    },
                    {
                      key: 'url',
                      label: 'URL',
                      priority: 'medium',
                      render: (row: ErrorLog) => (
                        <div className="truncate text-xs text-muted-foreground" title={row.url}>
                          {row.url}
                        </div>
                      ),
                    },
                    {
                      key: 'user',
                      label: 'Utilisateur',
                      priority: 'low',
                      render: (row: ErrorLog) => (
                        <span className="text-xs text-muted-foreground">
                          {row.context.userId ? (
                            <span title={row.context.userId}>
                              {row.context.userId.substring(0, 8)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </span>
                      ),
                    },
                  ]}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Utilisateur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getLevelBadgeVariant(log.context.level)}>
                              {getLevelIcon(log.context.level)}
                              <span className="ml-1">{log.context.level || 'component'}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.error.name}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={log.error.message}>
                              {log.error.message}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-xs text-muted-foreground" title={log.url}>
                              {log.url}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.context.userId ? (
                              <div className="truncate" title={log.context.userId}>
                                {log.context.userId.substring(0, 8)}...
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </DataTableErrorBoundary>
    </div>
  );
}










