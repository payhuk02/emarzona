import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  BookOpen,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Statistiques globales
 */
export interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgCompletionRate: number;
  monthlyGrowth: number; // %
}

/**
 * Cours populaire
 */
export interface PopularCourse {
  id: string;
  name: string;
  enrolledStudents: number;
  completionRate: number;
  revenue: number;
  rating: number;
}

/**
 * Activité récente
 */
export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'completion' | 'payment' | 'review';
  studentName: string;
  courseName: string;
  timestamp: Date | string;
  metadata?: {
    amount?: number;
    rating?: number;
  };
}

/**
 * Performance par catégorie
 */
export interface CategoryPerformance {
  category: string;
  coursesCount: number;
  enrollments: number;
  revenue: number;
  avgCompletion: number;
}

/**
 * Props pour CoursesDashboard
 */
export interface CoursesDashboardProps {
  /** Statistiques globales */
  stats: DashboardStats;
  
  /** Cours populaires */
  popularCourses: PopularCourse[];
  
  /** Activités récentes */
  recentActivities: RecentActivity[];
  
  /** Performance par catégorie */
  categoryPerformance: CategoryPerformance[];
  
  /** Callback de rafraîchissement */
  onRefresh?: () => void;
  
  /** Callback d'export */
  onExport?: () => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Période sélectionnée */
  period?: 'week' | 'month' | 'quarter' | 'year';
  
  /** Callback de changement de période */
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void;
}

/**
 * CoursesDashboard - Dashboard principal de gestion des cours
 * 
 * @example
 * ```tsx
 * <CoursesDashboard 
 *   stats={dashboardStats}
 *   popularCourses={topCourses}
 *   recentActivities={activities}
 *   categoryPerformance={categories}
 *   onRefresh={() => fetchData()}
 * />
 * ```
 */
export const CoursesDashboard: React.FC<CoursesDashboardProps> = ({
  stats,
  popularCourses,
  recentActivities,
  categoryPerformance,
  onRefresh,
  onExport,
  isLoading = false,
  className,
  period = 'month',
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Icônes pour les types d'activités
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'completion':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'review':
        return <Award className="h-4 w-4 text-yellow-600" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Cours</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos cours et performances</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: any) => handlePeriodChange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="quarter">90 derniers jours</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
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
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Cours</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <Badge variant="secondary" className="text-xs">
                  {stats.activeCourses} actifs
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Étudiants</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                {stats.monthlyGrowth !== 0 && (
                  <div className={cn(
                    'flex items-center text-xs',
                    stats.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stats.monthlyGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.monthlyGrowth)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Revenue Total</p>
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} EUR</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Taux Complétion Moy.</p>
              <p className="text-2xl font-bold">{stats.avgCompletionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full md:w-[500px] grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="popular">Cours populaires</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activités récentes */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activités Récentes
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="p-2 bg-background rounded-lg mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.courseName}
                        </p>
                        {activity.metadata?.amount && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {activity.metadata.amount} EUR
                          </Badge>
                        )}
                        {activity.metadata?.rating && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            ⭐ {activity.metadata.rating}/5
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Performance rapide */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Rapide
              </h3>
              <div className="space-y-4">
                {categoryPerformance.slice(0, 5).map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{category.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.coursesCount} cours • {category.enrollments} inscrits
                        </p>
                      </div>
                      <Badge variant="outline">{category.avgCompletion}%</Badge>
                    </div>
                    <Progress value={category.avgCompletion} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Cours populaires */}
        <TabsContent value="popular">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Top 10 Cours Populaires</h3>
            <div className="space-y-3">
              {popularCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg',
                    index === 0 && 'bg-yellow-100 text-yellow-700',
                    index === 1 && 'bg-gray-100 text-gray-700',
                    index === 2 && 'bg-orange-100 text-orange-700',
                    index > 2 && 'bg-muted text-muted-foreground'
                  )}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{course.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.enrolledStudents}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {course.completionRate}%
                      </span>
                      <span className="flex items-center gap-1">
                        ⭐ {course.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{course.revenue.toLocaleString()} EUR</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Performance par Catégorie</h3>
              <div className="space-y-4">
                {categoryPerformance.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.coursesCount} cours
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{category.revenue.toLocaleString()} EUR</p>
                        <p className="text-xs text-muted-foreground">
                          {category.enrollments} étudiants
                        </p>
                      </div>
                    </div>
                    <Progress value={category.avgCompletion} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Indicateurs Clés</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-700">Cours Actifs</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{stats.activeCourses}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    sur {stats.totalCourses} au total
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Croissance</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">ce mois-ci</p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-700">Taux de Complétion</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{stats.avgCompletionRate}%</p>
                  <p className="text-sm text-purple-600 mt-1">moyenne globale</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

CoursesDashboard.displayName = 'CoursesDashboard';

export default CoursesDashboard;

