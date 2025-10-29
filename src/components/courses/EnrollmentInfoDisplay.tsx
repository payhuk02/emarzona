import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  User,
  Mail,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Copy,
  ChevronRight,
  Award,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statuts possibles pour une inscription
 */
export type EnrollmentStatus =
  | 'pending'        // En attente de paiement/confirmation
  | 'active'         // Actif
  | 'completed'      // Cours terminé
  | 'expired'        // Accès expiré
  | 'cancelled'      // Annulé
  | 'refunded';      // Remboursé

/**
 * Variantes d'affichage du composant
 */
export type EnrollmentInfoVariant = 'compact' | 'default' | 'detailed';

/**
 * Informations étudiant
 */
export interface EnrollmentStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Informations cours
 */
export interface EnrollmentCourse {
  id: string;
  name: string;
  instructor: string;
  duration: number; // en heures
  price: number;
  currency?: string;
  totalLessons?: number;
}

/**
 * Props pour EnrollmentInfoDisplay
 */
export interface EnrollmentInfoDisplayProps {
  /** ID unique de l'inscription */
  enrollmentId: string;
  
  /** Statut de l'inscription */
  status: EnrollmentStatus;
  
  /** Date d'inscription */
  enrolledDate: Date | string;
  
  /** Informations étudiant */
  student: EnrollmentStudent;
  
  /** Informations cours */
  course: EnrollmentCourse;
  
  /** Progression (0-100%) */
  progress?: number;
  
  /** Leçons complétées */
  completedLessons?: number;
  
  /** Temps passé (en minutes) */
  timeSpent?: number;
  
  /** Variante d'affichage */
  variant?: EnrollmentInfoVariant;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Date de dernière activité */
  lastActivity?: Date | string;
  
  /** Date d'expiration (pour accès limité) */
  expiryDate?: Date | string;
  
  /** Montant payé */
  amountPaid?: number;
  
  /** Méthode de paiement */
  paymentMethod?: string;
  
  /** Certificat obtenu */
  hasCertificate?: boolean;
  
  /** Note moyenne (si quiz) */
  averageScore?: number;
  
  /** Callback pour actions */
  onAction?: (action: string) => void;
  
  /** Afficher les boutons d'action */
  showActions?: boolean;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<
  EnrollmentStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    textColor: string;
  }
> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  active: {
    label: 'Actif',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  completed: {
    label: 'Terminé',
    icon: GraduationCap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  expired: {
    label: 'Expiré',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  cancelled: {
    label: 'Annulé',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  refunded: {
    label: 'Remboursé',
    icon: DollarSign,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
};

/**
 * EnrollmentInfoDisplay - Composant d'affichage des informations d'inscription
 * 
 * @example
 * ```tsx
 * <EnrollmentInfoDisplay 
 *   enrollmentId="ENR-001"
 *   status="active"
 *   enrolledDate={new Date()}
 *   student={{ id: '1', name: 'John Doe', email: 'john@example.com' }}
 *   course={{ id: '1', name: 'React Avancé', instructor: 'Jane Smith', duration: 20, price: 99 }}
 *   progress={45}
 *   variant="detailed"
 * />
 * ```
 */
export const EnrollmentInfoDisplay: React.FC<EnrollmentInfoDisplayProps> = ({
  enrollmentId,
  status,
  enrolledDate,
  student,
  course,
  progress,
  completedLessons,
  timeSpent,
  variant = 'default',
  className,
  lastActivity,
  expiryDate,
  amountPaid,
  paymentMethod,
  hasCertificate = false,
  averageScore,
  onAction,
  showActions = false,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formater la durée
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}min`;
  };

  // Copier dans le presse-papier
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // VARIANT: COMPACT
  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <p className="font-semibold text-sm">{student.name}</p>
              <p className="text-xs text-muted-foreground">{course.name}</p>
            </div>
          </div>

          <div className="text-right">
            {progress !== undefined && (
              <p className="text-sm font-medium">{progress}%</p>
            )}
            <p className="text-xs text-muted-foreground">#{enrollmentId}</p>
          </div>
        </div>
      </Card>
    );
  }

  // VARIANT: DEFAULT
  if (variant === 'default') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-lg', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', config.textColor)}>
                  {config.label}
                </p>
                <p className="text-sm text-muted-foreground">#{enrollmentId}</p>
              </div>
            </div>
            {hasCertificate && (
              <Badge variant="outline" className="text-xs bg-yellow-50">
                <Award className="h-3 w-3 mr-1" />
                Certificat
              </Badge>
            )}
          </div>

          <Separator />

          {/* Student info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{student.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(student.email)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Course info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm">{course.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Par {course.instructor} • {course.duration}h
            </p>
          </div>

          {/* Progress */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {completedLessons !== undefined && course.totalLessons && (
                <p className="text-xs text-muted-foreground">
                  {completedLessons}/{course.totalLessons} leçons complétées
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && onAction && status === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onAction('continue')}
                className="flex-1"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Continuer
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // VARIANT: DETAILED
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header with full status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', config.bgColor)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <h3 className={cn('text-lg font-bold', config.textColor)}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Inscription #{enrollmentId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasCertificate && (
              <Badge variant="outline" className="bg-yellow-50">
                <Award className="h-4 w-4 mr-1" />
                Certificat obtenu
              </Badge>
            )}
            {averageScore !== undefined && (
              <Badge variant="secondary">
                <TrendingUp className="h-4 w-4 mr-1" />
                {averageScore}% score moyen
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date d'inscription</p>
                <p className="text-base font-semibold mt-1">
                  {formatDate(enrolledDate)}
                </p>
              </div>
            </div>
          </Card>
          
          {lastActivity && (
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Dernière activité</p>
                  <p className="text-base font-semibold mt-1">
                    {formatDate(lastActivity)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Student detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations étudiant
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {student.avatar && (
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Voir profil
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{student.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => copyToClipboard(student.email)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Course detailed info */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Détails du cours
          </h4>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{course.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Instructeur : {course.instructor}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {course.price} {course.currency || 'EUR'}
                </p>
                <p className="text-xs text-muted-foreground">{course.duration}h de contenu</p>
              </div>
            </div>
            {amountPaid !== undefined && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Paiement effectué</span>
                  </div>
                  <span className="font-semibold">
                    {amountPaid} {course.currency || 'EUR'}
                    {paymentMethod && (
                      <span className="text-xs text-muted-foreground ml-2">
                        via {paymentMethod}
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Progress detailed */}
        {progress !== undefined && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Progression</h4>
            <Card className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Complétion globale</span>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                {completedLessons !== undefined && course.totalLessons && (
                  <div>
                    <p className="text-xs text-muted-foreground">Leçons</p>
                    <p className="text-sm font-semibold">
                      {completedLessons}/{course.totalLessons}
                    </p>
                  </div>
                )}
                {timeSpent !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Temps passé</p>
                    <p className="text-sm font-semibold">{formatDuration(timeSpent)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Expiry warning */}
        {expiryDate && status === 'active' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Accès expire le {formatDate(expiryDate)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                L'étudiant perdra l'accès au cours après cette date
              </p>
            </div>
          </div>
        )}

        {/* Detailed actions */}
        {showActions && onAction && (
          <div className="flex gap-3 pt-4">
            {status === 'active' && (
              <>
                <Button
                  size="default"
                  onClick={() => onAction('view_course')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir le cours
                </Button>
                {progress === 100 && !hasCertificate && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={() => onAction('generate_certificate')}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Générer certificat
                  </Button>
                )}
              </>
            )}
            {status === 'pending' && (
              <Button
                size="default"
                onClick={() => onAction('complete_payment')}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Compléter le paiement
              </Button>
            )}
            {status === 'completed' && hasCertificate && (
              <Button
                size="default"
                onClick={() => onAction('download_certificate')}
                className="w-full"
              >
                <Award className="h-4 w-4 mr-2" />
                Télécharger le certificat
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

EnrollmentInfoDisplay.displayName = 'EnrollmentInfoDisplay';

export default EnrollmentInfoDisplay;

