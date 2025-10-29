import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  MapPin,
  Globe,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  TrendingUp,
  FileDown,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Type d'événement de téléchargement
 */
export type DownloadEventType =
  | 'download_started'
  | 'download_completed'
  | 'download_failed'
  | 'license_activated'
  | 'license_revoked'
  | 'access_granted'
  | 'access_denied'
  | 'suspicious_activity';

/**
 * Événement de téléchargement
 */
export interface DownloadEvent {
  id: string;
  type: DownloadEventType;
  timestamp: Date | string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  browser?: string;
  fileSize?: number; // en MB
  duration?: number; // en secondes
  status: 'success' | 'warning' | 'error';
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Filtre de période
 */
export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

/**
 * Props pour DownloadHistory
 */
export interface DownloadHistoryProps {
  /** Liste des événements de téléchargement */
  events: DownloadEvent[];
  
  /** Callback lors de la sélection d'un événement */
  onEventClick?: (event: DownloadEvent) => void;
  
  /** Afficher les filtres */
  showFilters?: boolean;
  
  /** Afficher la recherche */
  showSearch?: boolean;
  
  /** Mode d'affichage */
  variant?: 'timeline' | 'table';
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Nombre d'événements par page */
  pageSize?: number;
}

/**
 * Configuration des types d'événements
 */
const EVENT_CONFIG: Record<
  DownloadEventType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  download_started: {
    label: 'Téléchargement démarré',
    icon: FileDown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  download_completed: {
    label: 'Téléchargement réussi',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  download_failed: {
    label: 'Téléchargement échoué',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  license_activated: {
    label: 'Licence activée',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  license_revoked: {
    label: 'Licence révoquée',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  access_granted: {
    label: 'Accès autorisé',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  access_denied: {
    label: 'Accès refusé',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  suspicious_activity: {
    label: 'Activité suspecte',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

/**
 * DownloadHistory - Composant d'affichage de l'historique des téléchargements
 * 
 * @example
 * ```tsx
 * <DownloadHistory 
 *   events={downloadEvents}
 *   onEventClick={(event) => console.log('Event:', event)}
 *   showFilters={true}
 *   showSearch={true}
 *   variant="timeline"
 * />
 * ```
 */
export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  events,
  onEventClick,
  showFilters = true,
  showSearch = true,
  variant = 'timeline',
  className,
  pageSize = 20,
}) => {
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DownloadEventType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Formater l'heure
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater la durée
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  // Formater la taille
  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Filtrer les événements par période
  const filterByPeriod = (event: DownloadEvent): boolean => {
    if (periodFilter === 'all') return true;
    
    const eventDate = typeof event.timestamp === 'string' 
      ? new Date(event.timestamp) 
      : event.timestamp;
    const now = new Date();
    
    switch (periodFilter) {
      case 'today':
        return eventDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return eventDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return eventDate >= monthAgo;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return eventDate >= yearAgo;
      default:
        return true;
    }
  };

  // Filtrer et trier les événements
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.productName.toLowerCase().includes(query) ||
          e.customerName.toLowerCase().includes(query) ||
          e.customerEmail.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
      );
    }

    // Filtre type
    if (selectedType !== 'all') {
      result = result.filter((e) => e.type === selectedType);
    }

    // Filtre statut
    if (selectedStatus !== 'all') {
      result = result.filter((e) => e.status === selectedStatus);
    }

    // Filtre période
    result = result.filter(filterByPeriod);

    // Tri par date décroissante
    result.sort((a, b) => {
      const dateA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
      const dateB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [events, searchQuery, selectedType, selectedStatus, periodFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Grouper par date pour le variant timeline
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, DownloadEvent[]>();
    paginatedEvents.forEach((event) => {
      const dateKey = formatDate(event.timestamp);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });
    return grouped;
  }, [paginatedEvents]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec recherche et filtres */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Barre de recherche */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par produit, client ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Filtres */}
          {showFilters && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres:</span>
              </div>

              {/* Période */}
              <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>

              {/* Type d'événement */}
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as DownloadEventType | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(EVENT_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Statut */}
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as 'all' | 'success' | 'warning' | 'error')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">{filteredEvents.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Réussis</p>
                <p className="font-semibold text-green-600">
                  {filteredEvents.filter((e) => e.status === 'success').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Avertissements</p>
                <p className="font-semibold text-orange-600">
                  {filteredEvents.filter((e) => e.status === 'warning').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Erreurs</p>
                <p className="font-semibold text-red-600">
                  {filteredEvents.filter((e) => e.status === 'error').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline ou Table */}
      {variant === 'timeline' ? (
        <Card className="p-6">
          <ScrollArea className="h-[600px] pr-4">
            {paginatedEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Aucun événement trouvé</p>
                <p className="text-sm">Modifiez vos filtres pour voir plus d'événements</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(eventsByDate.entries()).map(([date, dateEvents]) => (
                  <div key={date}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{date}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="secondary">{dateEvents.length}</Badge>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-3 ml-7 border-l-2 border-border pl-6">
                      {dateEvents.map((event) => {
                        const config = EVENT_CONFIG[event.type];
                        const Icon = config.icon;
                        const isExpanded = expandedEvents.has(event.id);

                        return (
                          <div
                            key={event.id}
                            className={cn(
                              'relative -ml-[33px] transition-all',
                              onEventClick && 'cursor-pointer hover:scale-[1.01]'
                            )}
                            onClick={() => onEventClick?.(event)}
                          >
                            {/* Timeline dot */}
                            <div className={cn('absolute left-0 top-3 w-4 h-4 rounded-full border-2 border-background', config.bgColor)} />

                            <Card className={cn('p-4 ml-8', config.bgColor)}>
                              <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <Icon className={cn('h-5 w-5', config.color)} />
                                    <div className="flex-1">
                                      <p className="font-semibold">{config.label}</p>
                                      <p className="text-sm text-muted-foreground">{formatTime(event.timestamp)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {event.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                    {event.status === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                                    {event.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleEventExpansion(event.id);
                                      }}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Basic info */}
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{event.productName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{event.customerName}</span>
                                  </div>
                                </div>

                                {/* Message */}
                                {event.message && (
                                  <p className="text-sm text-muted-foreground italic">{event.message}</p>
                                )}

                                {/* Expanded details */}
                                {isExpanded && (
                                  <div className="pt-3 border-t space-y-2 text-sm">
                                    {event.customerEmail && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-mono text-xs">{event.customerEmail}</span>
                                      </div>
                                    )}
                                    {event.ipAddress && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">IP:</span>
                                        <span className="font-mono text-xs">{event.ipAddress}</span>
                                      </div>
                                    )}
                                    {event.location && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Localisation:</span>
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    {event.device && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Appareil:</span>
                                        <span>{event.device}</span>
                                      </div>
                                    )}
                                    {event.fileSize && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Taille:</span>
                                        <span>{formatSize(event.fileSize)}</span>
                                      </div>
                                    )}
                                    {event.duration && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Durée:</span>
                                        <span>{formatDuration(event.duration)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} • {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        // Table variant (simplified)
        <Card className="p-4">
          <p className="text-muted-foreground text-center py-8">
            Vue table disponible prochainement
          </p>
        </Card>
      )}
    </div>
  );
};

DownloadHistory.displayName = 'DownloadHistory';

export default DownloadHistory;

