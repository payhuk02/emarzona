import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Clock,
  Award,
  Search,
  Filter,
  RefreshCw,
  Download,
  Target,
  Calendar,
  BarChart3,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statistiques des étudiants
 */
export interface StudentDashboardStats {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  studentGrowth: number; // %
  avgProgressRate: number;
  avgTimeSpent: number; // heures
}

/**
 * Étudiant top performer
 */
export interface TopStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalTimeSpent: number; // heures
  avgScore: number;
  certificatesEarned: number;
}

/**
 * Étudiant à risque
 */
export interface AtRiskStudent {
  id: string;
  name: string;
  email: string;
  courseName: string;
  progressRate: number;
  lastActivityDays: number; // jours depuis dernière activité
  reason: 'inactive' | 'low_progress' | 'expiring_soon';
}

/**
 * Engagement des étudiants
 */
export interface StudentEngagement {
  date: string;
  activeStudents: number;
  lessonsCompleted: number;
  avgTimeSpent: number; // minutes
}

/**
 * Cycle de vie étudiant
 */
export interface StudentLifecycle {
  stage: 'new' | 'active' | 'engaged' | 'at_risk' | 'churned';
  count: number;
  percentage: number;
}

/**
 * Props pour StudentsDashboard
 */
export interface StudentsDashboardProps {
  /** Statistiques globales */
  stats: StudentDashboardStats;
  
  /** Top performers */
  topStudents: TopStudent[];
  
  /** Étudiants à risque */
  atRiskStudents: AtRiskStudent[];
  
  /** Engagement par jour */
  engagementData: StudentEngagement[];
  
  /** Cycle de vie */
  lifecycleData: StudentLifecycle[];
  
  /** Callback de rafraîchissement */
  onRefresh?: () => void;
  
  /** Callback d'export */
  onExport?: () => void;
  
  /** Callback de vue détails étudiant */
  onViewStudent?: (studentId: string) => void;
  
  /** Callback de contact étudiant */
  onContactStudent?: (studentId: string) => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * StudentsDashboard - Dashboard de gestion des étudiants
 * 
 * @example
 * ```tsx
 * <StudentsDashboard 
 *   stats={studentStats}
 *   topStudents={performers}
 *   atRiskStudents={riskyStudents}
 *   engagementData={engagement}
 *   lifecycleData={lifecycle}
 *   onRefresh={() => fetchData()}
 * />
 * ```
 */
export const StudentsDashboard: React.FC<StudentsDashboardProps> = ({
  stats,
  topStudents,
  atRiskStudents,
  engagementData,
  lifecycleData,
  onRefresh,
  onExport,
  onViewStudent,
  onContactStudent,
  isLoading = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Formater la durée
  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    return `${Math.round(hours)}h`;
  };

  // Labels du cycle de vie
  const lifecycleLabels: Record<string, string> = {
    new: 'Nouveaux',
    active: 'Actifs',
    engaged: 'Engagés',
    at_risk: 'À risque',
    churned: 'Inactifs',
  };

  // Couleurs du cycle de vie
  const lifecycleColors: Record<string, string> = {
    new: 'bg-blue-500',
    active: 'bg-green-500',
    engaged: 'bg-purple-500',
    at_risk: 'bg-orange-500',
    churned: 'bg-red-500',
  };

  // Raisons du risque
  const getRiskReasonLabel = (reason: string) => {
    switch (reason) {
      case 'inactive':
        return 'Inactif';
      case 'low_progress':
        return 'Faible progression';
      case 'expiring_soon':
        return 'Accès expirant';
      default:
        return 'Autre';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Étudiants</h1>
          <p className="text-muted-foreground">Suivez l'engagement et la progression de vos étudiants</p>
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <Button variant="outline" size="default" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Étudiants</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                {stats.studentGrowth !== 0 && (
                  <div className={cn(
                    'flex items-center text-xs',
                    stats.studentGrowth > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stats.studentGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.studentGrowth)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Étudiants Actifs</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.activeStudents.toLocaleString()}</p>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((stats.activeStudents / stats.totalStudents) * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Progression Moy.</p>
              <p className="text-2xl font-bold">{stats.avgProgressRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Temps Passé Moy.</p>
              <p className="text-2xl font-bold">{formatDuration(stats.avgTimeSpent)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cycle de vie */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Cycle de Vie des Étudiants</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            {lifecycleData.map((stage) => (
              <div
                key={stage.stage}
                className={cn(
                  'h-3 rounded-full transition-all',
                  lifecycleColors[stage.stage]
                )}
                style={{ width: `${stage.percentage}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-4">
            {lifecycleData.map((stage) => (
              <div key={stage.stage} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={cn('w-3 h-3 rounded-full', lifecycleColors[stage.stage])} />
                  <span className="text-sm font-medium">{lifecycleLabels[stage.stage]}</span>
                </div>
                <p className="text-2xl font-bold">{stage.count}</p>
                <p className="text-xs text-muted-foreground">{stage.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="top-students" className="space-y-4">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="top-students">Top Performers</TabsTrigger>
          <TabsTrigger value="at-risk">Étudiants à Risque</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Top Students */}
        <TabsContent value="top-students">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Top 10 Étudiants</h3>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
              </div>
            </div>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full font-bold',
                      index === 0 && 'bg-yellow-100 text-yellow-700',
                      index === 1 && 'bg-gray-100 text-gray-700',
                      index === 2 && 'bg-orange-100 text-orange-700',
                      index > 2 && 'bg-muted text-muted-foreground'
                    )}>
                      #{index + 1}
                    </div>

                    {student.avatar && (
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                    )}

                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {student.coursesCompleted}/{student.coursesEnrolled} cours
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ⭐ {student.avgScore}%
                        </Badge>
                        {student.certificatesEarned > 0 && (
                          <Badge variant="default" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {student.certificatesEarned}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatDuration(student.totalTimeSpent)}</p>
                      <p className="text-xs text-muted-foreground">temps passé</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {onViewStudent && (
                        <Button variant="outline" size="sm" onClick={() => onViewStudent(student.id)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                      )}
                      {onContactStudent && (
                        <Button variant="ghost" size="sm" onClick={() => onContactStudent(student.id)}>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contacter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* At Risk Students */}
        <TabsContent value="at-risk">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Étudiants à Risque ({atRiskStudents.length})
              </h3>
            </div>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                        <p className="text-sm text-muted-foreground mt-1">{student.courseName}</p>
                      </div>
                      <Badge variant="destructive">{getRiskReasonLabel(student.reason)}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{student.progressRate}%</span>
                      </div>
                      <Progress value={student.progressRate} className="h-2" />

                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Dernière activité</span>
                        <span className="font-medium text-orange-700">
                          Il y a {student.lastActivityDays} jour{student.lastActivityDays > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {onViewStudent && (
                        <Button size="sm" variant="outline" onClick={() => onViewStudent(student.id)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Voir Détails
                        </Button>
                      )}
                      {onContactStudent && (
                        <Button size="sm" onClick={() => onContactStudent(student.id)}>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contacter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Engagement */}
        <TabsContent value="engagement">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement des Étudiants (7 derniers jours)
            </h3>
            <div className="space-y-4">
              {engagementData.map((day) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{day.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        {day.activeStudents} actifs
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-green-600" />
                        {day.lessonsCompleted} leçons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-purple-600" />
                        {formatDuration(day.avgTimeSpent / 60)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${(day.activeStudents / stats.activeStudents) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

StudentsDashboard.displayName = 'StudentsDashboard';

export default StudentsDashboard;

