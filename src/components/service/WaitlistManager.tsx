import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Mail,
  Bell,
  Search,
  Filter,
  ArrowUpDown,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statut d'une personne sur la liste d'attente
 */
export type WaitlistStatus = 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';

/**
 * Priorité sur la liste d'attente
 */
export type WaitlistPriority = 'normal' | 'high' | 'urgent';

/**
 * Entrée de liste d'attente
 */
export interface WaitlistEntry {
  id: string;
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: WaitlistStatus;
  priority: WaitlistPriority;
  preferredDate?: Date | string;
  preferredTime?: string;
  notes?: string;
  position: number;
  createdAt: Date | string;
  notifiedAt?: Date | string;
  expiresAt?: Date | string;
}

/**
 * Statistiques de liste d'attente
 */
export interface WaitlistStats {
  totalWaiting: number;
  totalNotified: number;
  totalConverted: number;
  conversionRate: number;
  averageWaitTime: number; // en heures
}

/**
 * Props pour WaitlistManager
 */
export interface WaitlistManagerProps {
  /** Entrées de liste d'attente */
  entries: WaitlistEntry[];
  
  /** Callback pour notifier un client */
  onNotify?: (entryId: string) => Promise<void>;
  
  /** Callback pour notifier tous (auto) */
  onNotifyAll?: (serviceId?: string) => Promise<void>;
  
  /** Callback pour supprimer une entrée */
  onRemove?: (entryId: string) => Promise<void>;
  
  /** Callback pour convertir en réservation */
  onConvert?: (entryId: string) => Promise<void>;
  
  /** Callback pour ajouter à la liste */
  onAdd?: (entry: Partial<WaitlistEntry>) => Promise<void>;
  
  /** Services disponibles pour filtrage */
  availableServices?: { id: string; name: string }[];
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<
  WaitlistStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  waiting: {
    label: 'En attente',
    color: 'text-yellow-600 bg-yellow-50',
    icon: Clock,
  },
  notified: {
    label: 'Notifié',
    color: 'text-blue-600 bg-blue-50',
    icon: Bell,
  },
  converted: {
    label: 'Converti',
    color: 'text-green-600 bg-green-50',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expiré',
    color: 'text-gray-600 bg-gray-50',
    icon: Clock,
  },
  cancelled: {
    label: 'Annulé',
    color: 'text-red-600 bg-red-50',
    icon: XCircle,
  },
};

const PRIORITY_CONFIG: Record<WaitlistPriority, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' },
  high: { label: 'Élevée', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

/**
 * WaitlistManager - Gestion de la liste d'attente
 */
export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  entries,
  onNotify,
  onNotifyAll,
  onRemove,
  onConvert,
  onAdd,
  availableServices = [],
  className,
}) => {
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<WaitlistStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'createdAt' | 'priority'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isNotifying, setIsNotifying] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filtrer et trier
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filtre service
    if (filterService && filterService !== 'all') {
      result = result.filter((e) => e.serviceId === filterService);
    }

    // Filtre statut
    if (filterStatus && filterStatus !== 'all') {
      result = result.filter((e) => e.status === filterStatus);
    }

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.customerName.toLowerCase().includes(query) ||
          e.customerEmail.toLowerCase().includes(query) ||
          e.serviceName.toLowerCase().includes(query)
      );
    }

    // Tri
    result.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 3, high: 2, normal: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [entries, filterService, filterStatus, searchQuery, sortBy, sortOrder]);

  // Calculer les stats
  const stats = useMemo((): WaitlistStats => {
    const totalWaiting = entries.filter((e) => e.status === 'waiting').length;
    const totalNotified = entries.filter((e) => e.status === 'notified').length;
    const totalConverted = entries.filter((e) => e.status === 'converted').length;
    
    const conversionRate =
      totalNotified + totalConverted > 0
        ? (totalConverted / (totalNotified + totalConverted)) * 100
        : 0;

    // Calculer temps d'attente moyen
    const waitingTimes = entries
      .filter((e) => e.status === 'converted' && e.notifiedAt)
      .map((e) => {
        const created = new Date(e.createdAt).getTime();
        const notified = new Date(e.notifiedAt!).getTime();
        return (notified - created) / (1000 * 60 * 60); // en heures
      });

    const averageWaitTime =
      waitingTimes.length > 0
        ? waitingTimes.reduce((sum, time) => sum + time, 0) / waitingTimes.length
        : 0;

    return {
      totalWaiting,
      totalNotified,
      totalConverted,
      conversionRate,
      averageWaitTime,
    };
  }, [entries]);

  // Notifier un client
  const handleNotify = async (entryId: string) => {
    if (!onNotify) return;
    setIsNotifying(entryId);
    try {
      await onNotify(entryId);
    } catch (error) {
      logger.error('Error notifying', { error, entryId });
    } finally {
      setIsNotifying(null);
    }
  };

  // Notifier tous
  const handleNotifyAll = async () => {
    if (!onNotifyAll) return;
    await onNotifyAll(filterService !== 'all' ? filterService : undefined);
  };

  // Format date relative
  const formatRelativeDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Il y a moins d\'1h';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Liste d'attente
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les clients en attente de disponibilité
          </p>
        </div>
        <div className="flex gap-2">
          {onNotifyAll && stats.totalWaiting > 0 && (
            <Button variant="outline" onClick={handleNotifyAll}>
              <Bell className="h-4 w-4 mr-2" />
              Notifier tous ({stats.totalWaiting})
            </Button>
          )}
          {onAdd && (
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalWaiting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Notifiés</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalNotified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Convertis</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalConverted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Taux de conversion</p>
            <p className="text-2xl font-bold">{Math.round(stats.conversionRate)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Attente moyenne</p>
            <p className="text-2xl font-bold">{Math.round(stats.averageWaitTime)}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {availableServices.length > 0 && (
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {availableServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as any)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as any)}
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="position">Position</SelectItem>
            <SelectItem value="createdAt">Date</SelectItem>
            <SelectItem value="priority">Priorité</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        {filteredEntries.length} résultat(s)
      </p>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Préférence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Aucune entrée dans la liste d'attente
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => {
                const statusConfig = STATUS_CONFIG[entry.status];
                const StatusIcon = statusConfig.icon;
                const priorityConfig = PRIORITY_CONFIG[entry.priority];

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      {entry.position}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.customerName}</p>
                        <p className="text-xs text-muted-foreground">{entry.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.serviceName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.preferredDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(entry.preferredDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {entry.preferredTime && ` ${entry.preferredTime}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {entry.status === 'waiting' && onNotify && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotify(entry.id)}
                            disabled={isNotifying === entry.id}
                            className="h-8"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Notifier
                          </Button>
                        )}
                        {entry.status === 'notified' && onConvert && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConvert(entry.id)}
                            className="h-8 text-green-600"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Convertir
                          </Button>
                        )}
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(entry.id)}
                            className="h-8 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Conversion progress (si applicable) */}
      {stats.totalNotified > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taux de conversion</CardTitle>
            <CardDescription>
              {stats.totalConverted} convertis sur {stats.totalNotified + stats.totalConverted} notifiés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={stats.conversionRate} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(stats.conversionRate)}% de taux de conversion
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

WaitlistManager.displayName = 'WaitlistManager';

export default WaitlistManager;

