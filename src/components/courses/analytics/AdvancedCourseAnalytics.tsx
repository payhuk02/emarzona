/**
 * Advanced Course Analytics Dashboard
 * Dashboard analytique avancé pour instructeurs avec métriques détaillées
 * Date: 27 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
} from 'lucide-react';
import { useCourseAnalytics, useCourseViewsTimeline } from '@/hooks/courses/useCourseAnalytics';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';

interface AdvancedCourseAnalyticsProps {
  courseId: string;
  productId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdvancedCourseAnalytics = ({ courseId, productId }: AdvancedCourseAnalyticsProps) => {
  const { data: analytics, isLoading: analyticsLoading } = useCourseAnalytics(productId);
  const { data: timeline, isLoading: timelineLoading } = useCourseViewsTimeline(productId, 30);
  const { data: courseData } = useCourseDetail(courseId);

  if (analyticsLoading || timelineLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!analytics || !courseData) {
    return null;
  }

  const course = courseData.course;
  const enrollments = courseData.enrollments || [];

  // Calculs métriques avancées
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = enrollments.filter(e => e.progress_percentage >= 100).length;
  const averageProgress = enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / totalEnrollments || 0;
  const totalWatchTime = enrollments.reduce((sum, e) => sum + (e.total_watch_time_minutes || 0), 0);
  const averageWatchTime = totalWatchTime / totalEnrollments || 0;

  // Données pour graphiques
  const enrollmentData = [
    { name: 'Actifs', value: activeEnrollments, color: COLORS[1] },
    { name: 'Complétés', value: completedEnrollments, color: COLORS[2] },
    { name: 'Inactifs', value: totalEnrollments - activeEnrollments - completedEnrollments, color: COLORS[3] },
  ];

  const progressData = [
    { name: '0-25%', value: enrollments.filter(e => e.progress_percentage < 25).length },
    { name: '25-50%', value: enrollments.filter(e => e.progress_percentage >= 25 && e.progress_percentage < 50).length },
    { name: '50-75%', value: enrollments.filter(e => e.progress_percentage >= 50 && e.progress_percentage < 75).length },
    { name: '75-100%', value: enrollments.filter(e => e.progress_percentage >= 75 && e.progress_percentage < 100).length },
    { name: '100%', value: enrollments.filter(e => e.progress_percentage === 100).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics Avancés</h2>
        <p className="text-muted-foreground">
          Analyse détaillée des performances et de l'engagement des étudiants
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="students">Étudiants</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  {activeEnrollments} actifs, {completedEnrollments} complétés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageProgress.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Taux de complétion global
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps de Visionnage</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(averageWatchTime)} min</div>
                <p className="text-xs text-muted-foreground">
                  Moyenne par étudiant
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversion_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.views_trend > 0 ? '+' : ''}{analytics.views_trend}% vs période précédente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline des vues */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Vues (30 jours)</CardTitle>
              </CardHeader>
              <CardContent>
                <LazyRechartsWrapper>
                  {(recharts) => (
                    <recharts.ResponsiveContainer width="100%" height={300}>
                      <recharts.LineChart data={timeline || []}>
                        <recharts.CartesianGrid strokeDasharray="3 3" />
                        <recharts.XAxis dataKey="date" />
                        <recharts.YAxis />
                        <recharts.Tooltip />
                        <recharts.Legend />
                        <recharts.Line type="monotone" dataKey="views" stroke="#3b82f6" name="Vues" />
                        <recharts.Line type="monotone" dataKey="enrollments" stroke="#10b981" name="Inscriptions" />
                      </recharts.LineChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              </CardContent>
            </Card>

            {/* Distribution des inscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Statut des Inscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <LazyRechartsWrapper>
                  {(recharts) => (
                    <recharts.ResponsiveContainer width="100%" height={300}>
                      <recharts.PieChart>
                        <recharts.Pie
                          data={enrollmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {enrollmentData.map((entry, index) => (
                            <recharts.Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </recharts.Pie>
                        <recharts.Tooltip />
                      </recharts.PieChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Distribution de la progression */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution de la Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.BarChart data={progressData}>
                      <recharts.CartesianGrid strokeDasharray="3 3" />
                      <recharts.XAxis dataKey="name" />
                      <recharts.YAxis />
                      <recharts.Tooltip />
                      <recharts.Bar dataKey="value" fill="#3b82f6" />
                    </recharts.BarChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étudiants */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails des Étudiants</CardTitle>
              <CardDescription>
                Liste complète des inscriptions avec progression détaillée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Étudiant #{enrollment.id.slice(0, 8)}</span>
                        <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                          {enrollment.status}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>Progression: {enrollment.progress_percentage.toFixed(1)}%</span>
                          <span>•</span>
                          <span>{enrollment.completed_lessons}/{enrollment.total_lessons} leçons</span>
                        </div>
                        {enrollment.total_watch_time_minutes && (
                          <div className="text-xs text-muted-foreground">
                            Temps de visionnage: {enrollment.total_watch_time_minutes} minutes
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {enrollment.certificate_earned && (
                        <Badge variant="outline" className="bg-green-50">
                          <Award className="h-3 w-3 mr-1" />
                          Certificat
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métriques d'Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de rétention</span>
                  <span className="font-bold">{((activeEnrollments / totalEnrollments) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de complétion</span>
                  <span className="font-bold">{((completedEnrollments / totalEnrollments) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temps moyen par leçon</span>
                  <span className="font-bold">{Math.round(averageWatchTime / (course.total_lessons || 1))} min</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {averageProgress < 50 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Progression moyenne faible. Envisagez d'ajouter plus de contenu interactif.
                    </p>
                  </div>
                )}
                {completedEnrollments < totalEnrollments * 0.3 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Taux de complétion bas. Envisagez des rappels automatiques.
                    </p>
                  </div>
                )}
                {averageWatchTime < 30 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ Les étudiants regardent activement vos vidéos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenus */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Revenus</CardTitle>
              <CardDescription>
                Statistiques de revenus et conversions (à venir)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Fonctionnalité en développement
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

