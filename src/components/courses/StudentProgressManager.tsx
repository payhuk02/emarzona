import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Calendar,
  Target,
  BarChart3,
  FileText,
  Download,
  Bell,
  Trophy,
  Star,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Étape de progression (milestone)
 */
export interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  percentage: number; // Pourcentage requis
  reward?: string;
  isUnlocked: boolean;
  unlockedAt?: Date | string;
}

/**
 * Leçon complétée
 */
export interface CompletedLesson {
  id: string;
  title: string;
  completedAt: Date | string;
  timeSpent: number; // minutes
  score?: number;
}

/**
 * Statistiques de progression
 */
export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalTimeSpent: number; // minutes
  averageScore: number;
  streak: number; // jours consécutifs
  lastActivity: Date | string;
  estimatedTimeToComplete: number; // heures
}

/**
 * Props pour StudentProgressManager
 */
export interface StudentProgressManagerProps {
  /** ID de l'inscription */
  enrollmentId: string;

  /** Nom de l'étudiant */
  studentName: string;

  /** Nom du cours */
  courseName: string;

  /** Statistiques de progression */
  stats: ProgressStats;

  /** Étapes de progression */
  milestones: ProgressMilestone[];

  /** Leçons complétées */
  completedLessons: CompletedLesson[];

  /** Callback pour envoyer une notification */
  onSendNotification?: () => void;

  /** Callback pour télécharger le certificat */
  onDownloadCertificate?: () => void;

  /** Callback pour générer le rapport */
  onGenerateReport?: () => void;

  /** Classe CSS personnalisée */
  className?: string;

  /** Afficher les actions */
  showActions?: boolean;
}

/**
 * StudentProgressManager - Gestionnaire de progression détaillée
 * 
 * @example
 * ```tsx
 * <StudentProgressManager 
 *   enrollmentId="ENR-12345"
 *   studentName="John Doe"
 *   courseName="React Avancé"
 *   stats={progressStats}
 *   milestones={milestones}
 *   completedLessons={lessons}
 *   showActions={true}
 * />
 * ```
 */
export const StudentProgressManager: React.FC<StudentProgressManagerProps> = ({
  enrollmentId,
  studentName,
  courseName,
  stats,
  milestones,
  completedLessons,
  onSendNotification,
  onDownloadCertificate,
  onGenerateReport,
  className,
  showActions = true,
}) => {
  const [showLessonsDialog, setShowLessonsDialog] = useState(false);

  // Formater la durée
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}min`;
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculer la tendance
  const getTrend = () => {
    // TODO: Calculer basé sur les dernières semaines
    return 'up'; // 'up', 'down', 'stable'
  };

  const trend = getTrend();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{studentName}</h2>
            <p className="text-muted-foreground">{courseName}</p>
            <p className="text-xs text-muted-foreground mt-1">ID: {enrollmentId}</p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {onSendNotification && (
                <Button variant="outline" size="sm" onClick={onSendNotification}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifier
                </Button>
              )}
              {onGenerateReport && (
                <Button variant="outline" size="sm" onClick={onGenerateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport
                </Button>
              )}
              {stats.completionPercentage === 100 && onDownloadCertificate && (
                <Button onClick={onDownloadCertificate}>
                  <Download className="h-4 w-4 mr-2" />
                  Certificat
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progression globale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progression globale</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.completionPercentage}%</span>
              {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
            </div>
          </div>
          <Progress value={stats.completionPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.completedLessons}/{stats.totalLessons} leçons</span>
            <span>Temps estimé restant: {stats.estimatedTimeToComplete}h</span>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temps passé</p>
              <p className="text-lg font-bold">{formatDuration(stats.totalTimeSpent)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score moyen</p>
              <p className="text-lg font-bold">{stats.averageScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Trophy className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Série</p>
              <p className="text-lg font-bold">{stats.streak} jours</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dernière activité</p>
              <p className="text-sm font-bold">{formatDate(stats.lastActivity)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="milestones">Étapes</TabsTrigger>
          <TabsTrigger value="lessons">Leçons</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        {/* Étapes de progression */}
        <TabsContent value="milestones">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Étapes de progression
            </h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border-2 transition-colors',
                      milestone.isUnlocked
                        ? 'border-green-200 bg-green-50'
                        : 'border-border bg-muted/30'
                    )}
                  >
                    <div
                      className={cn(
                        'p-3 rounded-full',
                        milestone.isUnlocked ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    >
                      {milestone.isUnlocked ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <span className="text-white font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{milestone.title}</h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                        <Badge variant={milestone.isUnlocked ? 'default' : 'outline'}>
                          {milestone.percentage}%
                        </Badge>
                      </div>
                      {milestone.reward && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-700 font-medium">{milestone.reward}</span>
                        </div>
                      )}
                      {milestone.isUnlocked && milestone.unlockedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Débloqué le {formatDate(milestone.unlockedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Leçons complétées */}
        <TabsContent value="lessons">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Leçons complétées ({completedLessons.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowLessonsDialog(true)}>
                Voir tout
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {completedLessons.slice(0, 10).map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(lesson.completedAt)} • {formatDuration(lesson.timeSpent)}
                        </p>
                      </div>
                    </div>
                    {lesson.score !== undefined && (
                      <Badge variant={lesson.score >= 80 ? 'default' : 'secondary'}>
                        {lesson.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Analyse */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analyse de progression
            </h3>
            <div className="space-y-6">
              {/* Performance globale */}
              <div>
                <h4 className="text-sm font-medium mb-3">Performance globale</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Taux de complétion</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completionPercentage}%</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Score moyen</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.averageScore}%</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rythme d'apprentissage */}
              <div>
                <h4 className="text-sm font-medium mb-3">Rythme d'apprentissage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leçons par semaine</span>
                    <span className="font-semibold">
                      {Math.round(stats.completedLessons / (stats.streak / 7) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temps moyen par leçon</span>
                    <span className="font-semibold">
                      {formatDuration(Math.round(stats.totalTimeSpent / stats.completedLessons || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Série actuelle</span>
                    <Badge variant="outline">{stats.streak} jours consécutifs</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Prédictions */}
              <div>
                <h4 className="text-sm font-medium mb-3">Prédictions</h4>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Date de complétion estimée
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Si vous maintenez ce rythme, vous terminerez le cours dans environ{' '}
                        {stats.estimatedTimeToComplete} heures
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog liste complète des leçons */}
      <Dialog open={showLessonsDialog} onOpenChange={setShowLessonsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Toutes les leçons complétées</DialogTitle>
            <DialogDescription>
              {completedLessons.length} leçon{completedLessons.length > 1 ? 's' : ''} terminée{completedLessons.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {completedLessons.map((lesson) => (
                <div key={lesson.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{lesson.title}</p>
                    {lesson.score !== undefined && (
                      <Badge variant={lesson.score >= 80 ? 'default' : 'secondary'}>
                        {lesson.score}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(lesson.completedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(lesson.timeSpent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

StudentProgressManager.displayName = 'StudentProgressManager';

export default StudentProgressManager;

