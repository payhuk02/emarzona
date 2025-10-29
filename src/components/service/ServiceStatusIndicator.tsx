import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour un service
 */
export type ServiceStatus = 
  | 'available'     // Disponible pour réservation
  | 'booked'        // Réservé
  | 'pending'       // En attente de confirmation
  | 'in_progress'   // En cours
  | 'completed'     // Terminé
  | 'cancelled';    // Annulé

/**
 * Variantes d'affichage du composant
 */
export type ServiceStatusVariant = 'compact' | 'default' | 'detailed';

/**
 * Props pour ServiceStatusIndicator
 */
export interface ServiceStatusIndicatorProps {
  /** Statut actuel du service */
  status: ServiceStatus;
  
  /** Nombre de créneaux disponibles (optionnel) */
  availableSlots?: number;
  
  /** Nombre total de créneaux (optionnel) */
  totalSlots?: number;
  
  /** Seuil de capacité faible (par défaut: 20%) */
  lowCapacityThreshold?: number;
  
  /** Afficher la barre de progression */
  showProgress?: boolean;
  
  /** Variante d'affichage */
  variant?: ServiceStatusVariant;
  
  /** Nombre de réservations récentes (7 derniers jours) */
  recentBookings?: number;
  
  /** Tendance des réservations (pour variant detailed) */
  bookingTrend?: 'up' | 'down' | 'stable';
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Prochaine date disponible (pour status 'booked') */
  nextAvailableDate?: Date | string;
  
  /** Staff assigné (optionnel) */
  assignedStaff?: string;
}

/**
 * Configuration des statuts avec leurs propriétés visuelles
 */
const STATUS_CONFIG: Record<
  ServiceStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  available: {
    label: 'Disponible',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeVariant: 'default',
  },
  booked: {
    label: 'Réservé',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeVariant: 'secondary',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    badgeVariant: 'outline',
  },
  in_progress: {
    label: 'En cours',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeVariant: 'secondary',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    badgeVariant: 'outline',
  },
  cancelled: {
    label: 'Annulé',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeVariant: 'destructive',
  },
};

/**
 * ServiceStatusIndicator - Composant d'affichage du statut de service
 * 
 * @example
 * ```tsx
 * // Compact variant
 * <ServiceStatusIndicator 
 *   status="available" 
 *   variant="compact"
 * />
 * 
 * // Default with capacity
 * <ServiceStatusIndicator 
 *   status="booked" 
 *   availableSlots={3}
 *   totalSlots={10}
 *   showProgress={true}
 * />
 * 
 * // Detailed with trends
 * <ServiceStatusIndicator 
 *   status="available" 
 *   variant="detailed"
 *   availableSlots={15}
 *   totalSlots={20}
 *   recentBookings={12}
 *   bookingTrend="up"
 *   showProgress={true}
 * />
 * ```
 */
export const ServiceStatusIndicator: React.FC<ServiceStatusIndicatorProps> = ({
  status,
  availableSlots,
  totalSlots,
  lowCapacityThreshold = 20,
  showProgress = false,
  variant = 'default',
  recentBookings,
  bookingTrend = 'stable',
  className,
  nextAvailableDate,
  assignedStaff,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Calculer le pourcentage de capacité
  const capacityPercentage = totalSlots && availableSlots !== undefined
    ? ((totalSlots - availableSlots) / totalSlots) * 100
    : 0;

  const isLowCapacity = availableSlots !== undefined && totalSlots
    ? (availableSlots / totalSlots) * 100 <= lowCapacityThreshold
    : false;

  // Formater la prochaine date disponible
  const formatNextDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir l'icône de tendance
  const getTrendIcon = () => {
    switch (bookingTrend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // VARIANT: COMPACT
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center gap-1.5', className)}>
              <Icon className={cn('h-4 w-4', config.color)} />
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              {availableSlots !== undefined && totalSlots && (
                <span className="text-xs text-muted-foreground">
                  {availableSlots}/{totalSlots}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{config.label}</p>
              {availableSlots !== undefined && totalSlots && (
                <p className="text-xs text-muted-foreground">
                  {availableSlots} créneaux disponibles sur {totalSlots}
                </p>
              )}
              {nextAvailableDate && status === 'booked' && (
                <p className="text-xs text-muted-foreground">
                  Prochain: {formatNextDate(nextAvailableDate)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // VARIANT: DEFAULT
  if (variant === 'default') {
    return (
      <Card className={cn('p-4', config.borderColor, className)}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div>
                <p className={cn('font-semibold text-sm', config.textColor)}>
                  {config.label}
                </p>
                {assignedStaff && (
                  <p className="text-xs text-muted-foreground">{assignedStaff}</p>
                )}
              </div>
            </div>

            {/* Capacity badge */}
            {availableSlots !== undefined && totalSlots && (
              <Badge
                variant={isLowCapacity ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {availableSlots}/{totalSlots} disponibles
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {showProgress && totalSlots && availableSlots !== undefined && (
            <div className="space-y-1">
              <Progress 
                value={capacityPercentage} 
                className={cn(
                  'h-2',
                  isLowCapacity && 'bg-red-100'
                )}
              />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(capacityPercentage)}% réservé
              </p>
            </div>
          )}

          {/* Next available date */}
          {nextAvailableDate && status === 'booked' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Prochain créneau: {formatNextDate(nextAvailableDate)}</span>
            </div>
          )}

          {/* Low capacity warning */}
          {isLowCapacity && status === 'available' && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-orange-700">
                Capacité faible - Pensez à ouvrir de nouveaux créneaux
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // VARIANT: DETAILED
  return (
    <Card className={cn('p-4', config.borderColor, className)}>
      <div className="space-y-4">
        {/* Header with status and stats */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <p className={cn('font-bold text-base', config.textColor)}>
                {config.label}
              </p>
              {assignedStaff && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {assignedStaff}
                </p>
              )}
            </div>
          </div>

          {/* Capacity badge */}
          {availableSlots !== undefined && totalSlots && (
            <div className="text-right">
              <Badge
                variant={isLowCapacity ? 'destructive' : 'default'}
                className="text-sm"
              >
                {availableSlots}/{totalSlots}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                disponibles
              </p>
            </div>
          )}
        </div>

        {/* Detailed capacity progress */}
        {showProgress && totalSlots && availableSlots !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taux de réservation</span>
              <span className="font-medium">{Math.round(capacityPercentage)}%</span>
            </div>
            <Progress 
              value={capacityPercentage} 
              className={cn(
                'h-3',
                isLowCapacity ? 'bg-red-100' : 'bg-green-100'
              )}
            />
          </div>
        )}

        {/* Recent bookings and trend */}
        {recentBookings !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">7 derniers jours</p>
                <p className="text-sm font-semibold">{recentBookings} réservations</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">
                {bookingTrend === 'up' && '+'}
                {bookingTrend === 'down' && '-'}
                {bookingTrend === 'stable' && '='}
              </span>
            </div>
          </div>
        )}

        {/* Next available info */}
        {nextAvailableDate && status === 'booked' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-700 font-medium">Prochain créneau disponible</p>
              <p className="text-sm text-blue-900">{formatNextDate(nextAvailableDate)}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {isLowCapacity && status === 'available' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Capacité faible ({availableSlots} créneaux restants)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Recommandation : Ajouter des créneaux pour augmenter la disponibilité
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

ServiceStatusIndicator.displayName = 'ServiceStatusIndicator';

export default ServiceStatusIndicator;

