import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  Search,
  RefreshCw,
  User,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Award,
  TrendingUp,
  FileText,
  MessageSquare,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnrollmentStatus } from './EnrollmentInfoDisplay';

/**
 * Type d'événement dans l'historique
 */
export type EnrollmentEventType =
  | 'enrolled'          // Nouvelle inscription
  | 'payment_received'  // Paiement reçu
  | 'lesson_completed'  // Leçon terminée
  | 'quiz_passed'       // Quiz réussi
  | 'certificate_issued' // Certificat émis
  | 'refund_issued'     // Remboursement effectué
  | 'access_expired'    // Accès expiré
  | 'completed';        // Cours terminé

/**
 * Événement d'inscription
 */
export interface EnrollmentEvent {
  id: string;
  enrollmentId: string;
  type: EnrollmentEventType;
  timestamp: Date | string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  description: string;
  metadata?: {
    amount?: number;
    currency?: string;
    lessonTitle?: string;
    quizScore?: number;
    certificateId?: string;
    refundReason?: string;
    progressPercentage?: number;
  };
}

/**
 * Filtre de période
 */
export type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

/**
 * Props pour EnrollmentHistory
 */
export interface EnrollmentHistoryProps {
  /** Liste des événements */
  events: EnrollmentEvent[];
  
  /** Callback de rafraîchissement */
  onRefresh?: () => void;
  
  /** Callback de vue de détails */
  onViewDetails?: (enrollmentId: string) => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Afficher les filtres */
  showFilters?: boolean;
  
  /** Afficher les stats */
  showStats?: boolean;
}

/**
 * Configuration des types d'événements
 */
const EVENT_CONFIG: Record<
  EnrollmentEventType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  enrolled: {
    label: 'Inscription',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  payment_received: {
    label: 'Paiement',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  lesson_completed: {
    label: 'Leçon terminée',
    icon: CheckCircle2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  quiz_passed: {
    label: 'Quiz réussi',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  certificate_issued: {
    label: 'Certificat émis',
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  refund_issued: {
    label: 'Remboursement',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  access_expired: {
    label: 'Accès expiré',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  completed: {
    label: 'Cours terminé',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
};

/**
 * EnrollmentHistory - Historique complet des inscriptions
 * 
 * @example
 * ```tsx
 * <EnrollmentHistory 
 *   events={enrollmentEvents}
 *   onRefresh={() => fetchEvents()}
 *   showFilters={true}
 *   showStats={true}
 * />
 * ```
 */
export const EnrollmentHistory: React.FC<EnrollmentHistoryProps> = ({
  events,
  onRefresh,
  onViewDetails,
  isLoading = false,
  className,
  showFilters = true,
  showStats = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<EnrollmentEventType | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.studentName.toLowerCase().includes(query) ||
          event.studentEmail.toLowerCase().includes(query) ||
          event.courseName.toLowerCase().includes(query)
      );
    }

    // Filtrer par type
    if (selectedEventType !== 'all') {
      result = result.filter((event) => event.type === selectedEventType);
    }

    // Filtrer par période
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (selectedPeriod) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      result = result.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= filterDate;
      });
    }

    // Trier par date (plus récent en premier)
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    return result;
  }, [events, searchQuery, selectedEventType, selectedPeriod]);

  // Statistiques
  const stats = useMemo(() => {
    const totalEnrollments = filteredEvents.filter((e) => e.type === 'enrolled').length;
    const totalPayments = filteredEvents
      .filter((e) => e.type === 'payment_received')
      .reduce((sum, e) => sum + (e.metadata?.amount || 0), 0);
    const totalCompletions = filteredEvents.filter((e) => e.type === 'completed').length;
    const totalCertificates = filteredEvents.filter((e) => e.type === 'certificate_issued').length;

    return {
      totalEnrollments,
      totalPayments,
      totalCompletions,
      totalCertificates,
    };
  }, [filteredEvents]);

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater la date relative
  const formatRelativeDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(date);
  };

  // Exporter en CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Étudiant', 'Email', 'Cours', 'Description'],
      ...filteredEvents.map((event) => [
        formatDate(event.timestamp),
        EVENT_CONFIG[event.type].label,
        event.studentName,
        event.studentEmail,
        event.courseName,
        event.description,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historique des Inscriptions</h2>
          <p className="text-muted-foreground">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inscriptions</p>
                <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paiements</p>
                <p className="text-2xl font-bold">{stats.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cours terminés</p>
                <p className="text-2xl font-bold">{stats.totalCompletions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certificats</p>
                <p className="text-2xl font-bold">{stats.totalCertificates}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou cours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'événement</label>
                <Select
                  value={selectedEventType}
                  onValueChange={(value) => setSelectedEventType(value as EnrollmentEventType | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(EVENT_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <Select
                  value={selectedPeriod}
                  onValueChange={(value) => setSelectedPeriod(value as PeriodFilter)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute la période</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">30 derniers jours</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline des événements */}
      <Card>
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Chargement...</span>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Aucun événement</h3>
                <p className="text-sm text-muted-foreground">
                  Aucun événement ne correspond à vos critères
                </p>
              </div>
            ) : (
              filteredEvents.map((event, index) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = config.icon;

                return (
                  <div key={event.id}>
                    <div className="flex gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className={cn('p-2 rounded-full', config.bgColor)}>
                          <Icon className={cn('h-4 w-4', config.color)} />
                        </div>
                        {index < filteredEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>

                      {/* Event content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{config.label}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeDate(event.timestamp)}
                              </span>
                            </div>
                            <p className="font-medium">{event.studentName}</p>
                            <p className="text-sm text-muted-foreground">{event.courseName}</p>
                            <p className="text-sm mt-1">{event.description}</p>

                            {/* Metadata */}
                            {event.metadata && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {event.metadata.amount && (
                                  <Badge variant="secondary" className="text-xs">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {event.metadata.amount} {event.metadata.currency}
                                  </Badge>
                                )}
                                {event.metadata.lessonTitle && (
                                  <Badge variant="secondary" className="text-xs">
                                    {event.metadata.lessonTitle}
                                  </Badge>
                                )}
                                {event.metadata.quizScore !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {event.metadata.quizScore}%
                                  </Badge>
                                )}
                                {event.metadata.progressPercentage !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    Progression: {event.metadata.progressPercentage}%
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(event.enrollmentId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

EnrollmentHistory.displayName = 'EnrollmentHistory';

export default EnrollmentHistory;

