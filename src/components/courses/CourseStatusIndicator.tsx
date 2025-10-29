import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour un cours
 */
export type CourseStatus = 
  | 'draft'         // Brouillon
  | 'published'     // Publié
  | 'in_progress'   // En cours (pour étudiants)
  | 'completed'     // Terminé
  | 'archived';     // Archivé

/**
 * Variantes d'affichage du composant
 */
export type CourseStatusVariant = 'compact' | 'default' | 'detailed';

/**
 * Props pour CourseStatusIndicator
 */
export interface CourseStatusIndicatorProps {
  /** Statut actuel du cours */
  status: CourseStatus;
  
  /** Nombre d'étudiants inscrits */
  enrolledStudents?: number;
  
  /** Capacité maximale */
  maxStudents?: number;
  
  /** Seuil de capacité faible (par défaut: 20%) */
  lowCapacityThreshold?: number;
  
  /** Afficher la barre de progression */
  showProgress?: boolean;
  
  /** Variante d'affichage */
  variant?: CourseStatusVariant;
  
  /** Nombre d'inscriptions récentes (7 derniers jours) */
  recentEnrollments?: number;
  
  /** Tendance des inscriptions */
  enrollmentTrend?: 'up' | 'down' | 'stable';
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Taux de complétion moyen (%) */
  averageCompletion?: number;
  
  /** Revenue généré */
  revenue?: number;
  
  /** Devise */
  currency?: string;
  
  /** Instructeur assigné */
  instructor?: string;
}

/**
 * Configuration des statuts avec leurs propriétés visuelles
 */
const STATUS_CONFIG: Record<
  CourseStatus,
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
  draft: {
    label: 'Brouillon',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    badgeVariant: 'outline',
  },
  published: {
    label: 'Publié',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeVariant: 'default',
  },
  in_progress: {
    label: 'En cours',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeVariant: 'secondary',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeVariant: 'secondary',
  },
  archived: {
    label: 'Archivé',
    icon: Archive,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeVariant: 'outline',
  },
};

/**
 * CourseStatusIndicator - Composant d'affichage du statut de cours
 * 
 * @example
 * ```tsx
 * // Compact variant
 * <CourseStatusIndicator 
 *   status="published" 
 *   variant="compact"
 * />
 * 
 * // Default with enrollment
 * <CourseStatusIndicator 
 *   status="published" 
 *   enrolledStudents={45}
 *   maxStudents={100}
 *   showProgress={true}
 * />
 * 
 * // Detailed with trends
 * <CourseStatusIndicator 
 *   status="published" 
 *   variant="detailed"
 *   enrolledStudents={85}
 *   maxStudents={100}
 *   recentEnrollments={12}
 *   enrollmentTrend="up"
 *   revenue={4250}
 *   averageCompletion={67}
 *   showProgress={true}
 * />
 * ```
 */
export const CourseStatusIndicator: React.FC<CourseStatusIndicatorProps> = ({
  status,
  enrolledStudents,
  maxStudents,
  lowCapacityThreshold = 20,
  showProgress = false,
  variant = 'default',
  recentEnrollments,
  enrollmentTrend = 'stable',
  className,
  averageCompletion,
  revenue,
  currency = 'EUR',
  instructor,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Calculer le pourcentage d'occupation
  const enrollmentPercentage = maxStudents && enrolledStudents !== undefined
    ? (enrolledStudents / maxStudents) * 100
    : 0;

  const isLowCapacity = enrolledStudents !== undefined && maxStudents
    ? ((maxStudents - enrolledStudents) / maxStudents) * 100 <= lowCapacityThreshold
    : false;

  // Obtenir l'icône de tendance
  const getTrendIcon = () => {
    switch (enrollmentTrend) {
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
              {enrolledStudents !== undefined && maxStudents && (
                <span className="text-xs text-muted-foreground">
                  {enrolledStudents}/{maxStudents}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{config.label}</p>
              {enrolledStudents !== undefined && maxStudents && (
                <p className="text-xs text-muted-foreground">
                  {enrolledStudents} étudiants inscrits sur {maxStudents}
                </p>
              )}
              {averageCompletion !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Taux de complétion: {averageCompletion}%
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
                {instructor && (
                  <p className="text-xs text-muted-foreground">{instructor}</p>
                )}
              </div>
            </div>

            {/* Enrollment badge */}
            {enrolledStudents !== undefined && maxStudents && (
              <Badge
                variant={isLowCapacity && status === 'published' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {enrolledStudents}/{maxStudents} étudiants
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {showProgress && maxStudents && enrolledStudents !== undefined && (
            <div className="space-y-1">
              <Progress 
                value={enrollmentPercentage} 
                className={cn(
                  'h-2',
                  isLowCapacity && 'bg-orange-100'
                )}
              />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(enrollmentPercentage)}% inscrit
              </p>
            </div>
          )}

          {/* Average completion */}
          {averageCompletion !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>Complétion moyenne: {averageCompletion}%</span>
            </div>
          )}

          {/* Low capacity warning */}
          {isLowCapacity && status === 'published' && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-xs text-orange-700">
                Places limitées - Seulement {maxStudents - enrolledStudents} places restantes
              </p>
            </div>
          )}

          {/* Revenue */}
          {revenue !== undefined && revenue > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {revenue.toLocaleString()} {currency}
              </span>
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
              {instructor && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {instructor}
                </p>
              )}
            </div>
          </div>

          {/* Enrollment badge */}
          {enrolledStudents !== undefined && maxStudents && (
            <div className="text-right">
              <Badge
                variant={isLowCapacity && status === 'published' ? 'destructive' : 'default'}
                className="text-sm"
              >
                {enrolledStudents}/{maxStudents}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                étudiants
              </p>
            </div>
          )}
        </div>

        {/* Detailed enrollment progress */}
        {showProgress && maxStudents && enrolledStudents !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taux d'inscription</span>
              <span className="font-medium">{Math.round(enrollmentPercentage)}%</span>
            </div>
            <Progress 
              value={enrollmentPercentage} 
              className={cn(
                'h-3',
                isLowCapacity ? 'bg-orange-100' : 'bg-green-100'
              )}
            />
          </div>
        )}

        {/* Recent enrollments and trend */}
        {recentEnrollments !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">7 derniers jours</p>
                <p className="text-sm font-semibold">{recentEnrollments} inscriptions</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">
                {enrollmentTrend === 'up' && '+'}
                {enrollmentTrend === 'down' && '-'}
                {enrollmentTrend === 'stable' && '='}
              </span>
            </div>
          </div>
        )}

        {/* Completion & Revenue stats */}
        <div className="grid grid-cols-2 gap-3">
          {averageCompletion !== undefined && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-700 font-medium">Complétion moyenne</p>
                  <p className="text-lg font-bold text-blue-900">{averageCompletion}%</p>
                </div>
              </div>
            </div>
          )}

          {revenue !== undefined && revenue > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-700 font-medium">Revenue</p>
                  <p className="text-lg font-bold text-green-900">
                    {revenue.toLocaleString()} {currency}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {isLowCapacity && status === 'published' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Capacité limitée ({maxStudents - enrolledStudents} places restantes)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Recommandation : Augmenter la capacité ou créer une nouvelle session
              </p>
            </div>
          </div>
        )}

        {status === 'draft' && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Cours en brouillon
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Publiez ce cours pour le rendre accessible aux étudiants
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

CourseStatusIndicator.displayName = 'CourseStatusIndicator';

export default CourseStatusIndicator;

