import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  User,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  DollarSign,
  Download,
  Filter,
  Search,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Types d'événements de l'historique
 */
export type BookingEventType =
  | 'created'      // Réservation créée
  | 'confirmed'    // Confirmée
  | 'updated'      // Modifiée
  | 'cancelled'    // Annulée
  | 'completed'    // Terminée
  | 'rescheduled'  // Reprogrammée
  | 'payment';     // Paiement effectué

/**
 * Événement d'historique de réservation
 */
export interface BookingHistoryEvent {
  id: string;
  bookingId: string;
  type: BookingEventType;
  timestamp: Date | string;
  description: string;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    amount?: number;
    currency?: string;
    reason?: string;
    userId?: string;
    userName?: string;
  };
  customerName?: string;
  serviceName?: string;
}

/**
 * Filtres pour l'historique
 */
export interface BookingHistoryFilters {
  search?: string;
  eventType?: BookingEventType | 'all';
  dateRange?: {
    start?: Date | string;
    end?: Date | string;
  };
  bookingId?: string;
}

/**
 * Props pour BookingHistory
 */
export interface BookingHistoryProps {
  /** Liste des événements */
  events: BookingHistoryEvent[];
  
  /** Titre personnalisé */
  title?: string;
  
  /** Description personnalisée */
  description?: string;
  
  /** Afficher les filtres */
  showFilters?: boolean;
  
  /** Hauteur maximale du scroll area */
  maxHeight?: string;
  
  /** Callback pour exporter les données */
  onExport?: (filteredEvents: BookingHistoryEvent[]) => void;
  
  /** Callback pour rafraîchir */
  onRefresh?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Nombre d'événements par page */
  pageSize?: number;
}

/**
 * Configuration des types d'événements
 */
const EVENT_CONFIG: Record<
  BookingEventType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  created: {
    label: 'Créée',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  updated: {
    label: 'Modifiée',
    icon: Edit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  completed: {
    label: 'Terminée',
    icon: CheckCircle2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  rescheduled: {
    label: 'Reprogrammée',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  payment: {
    label: 'Paiement',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

/**
 * BookingHistory - Composant d'historique des réservations
 * 
 * @example
 * ```tsx
 * <BookingHistory 
 *   events={events}
 *   showFilters={true}
 *   onExport={(events) => console.log('Export', events)}
 *   maxHeight="600px"
 * />
 * ```
 */
export const BookingHistory: React.FC<BookingHistoryProps> = ({
  events,
  title = 'Historique des Réservations',
  description = 'Suivi complet de toutes les activités',
  showFilters = true,
  maxHeight = '500px',
  onExport,
  onRefresh,
  isLoading = false,
  className,
  pageSize = 50,
}) => {
  const [filters, setFilters] = useState<BookingHistoryFilters>({
    search: '',
    eventType: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (event) =>
          event.description.toLowerCase().includes(search) ||
          event.bookingId.toLowerCase().includes(search) ||
          event.customerName?.toLowerCase().includes(search) ||
          event.serviceName?.toLowerCase().includes(search)
      );
    }

    // Event type filter
    if (filters.eventType && filters.eventType !== 'all') {
      result = result.filter((event) => event.type === filters.eventType);
    }

    // Booking ID filter
    if (filters.bookingId) {
      result = result.filter((event) => event.bookingId === filters.bookingId);
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        result = result.filter((event) => new Date(event.timestamp) >= startDate);
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        result = result.filter((event) => new Date(event.timestamp) <= endDate);
      }
    }

    // Trier par date décroissante
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    return result;
  }, [events, filters]);

  // Pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEvents.slice(startIndex, startIndex + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize);

  // Statistiques
  const stats = useMemo(() => {
    const types = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<BookingEventType, number>);

    return {
      total: events.length,
      today: events.filter(
        (e) =>
          new Date(e.timestamp).toDateString() === new Date().toDateString()
      ).length,
      types,
    };
  }, [events]);

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export to CSV
  const handleExport = () => {
    if (!onExport) return;
    onExport(filteredEvents);
  };

  // Render single event
  const renderEvent = (event: BookingHistoryEvent) => {
    const config = EVENT_CONFIG[event.type];
    const Icon = config.icon;

    return (
      <div
        key={event.id}
        className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-lg h-fit', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
                {event.customerName && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {event.customerName}
                  </span>
                )}
                {event.serviceName && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {event.serviceName}
                  </span>
                )}
              </div>
              <p className="text-sm mt-1">{event.description}</p>

              {/* Metadata */}
              {event.metadata && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {event.metadata.reason && (
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Raison: {event.metadata.reason}
                    </p>
                  )}
                  {event.metadata.amount && (
                    <p className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Montant: {event.metadata.amount} {event.metadata.currency || 'EUR'}
                    </p>
                  )}
                  {event.metadata.userName && (
                    <p>Par: {event.metadata.userName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(event.timestamp)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                #{event.bookingId}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total événements</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
            <p className="text-2xl font-bold">{stats.today}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Créées</p>
            <p className="text-2xl font-bold">{stats.types.created || 0}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Terminées</p>
            <p className="text-2xl font-bold">{stats.types.completed || 0}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>

            <Select
              value={filters.eventType || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, eventType: value as any })
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {Object.entries(EVENT_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {filteredEvents.length} résultat(s)
            {filteredEvents.length !== events.length && ` sur ${events.length}`}
          </p>
          {totalPages > 1 && (
            <p className="text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
          )}
        </div>

        <Separator />

        {/* Events list */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucun événement trouvé</p>
          </div>
        ) : (
          <>
            <ScrollArea className="pr-4" style={{ height: maxHeight }}>
              <div className="space-y-2">
                {paginatedEvents.map((event) => renderEvent(event))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

BookingHistory.displayName = 'BookingHistory';

export default BookingHistory;

