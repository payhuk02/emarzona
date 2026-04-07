/**
 * Dashboard Analytics de Progression pour cours
 * Affichage des métriques détaillées, graphiques et insights
 * Date : 4 Février 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  BarChart3,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  useCourseProgressionAnalytics,
  useCourseProgressionSnapshots,
  useCreateProgressionSnapshot,
  useCalculateCourseProgressionAnalytics,
} from '@/hooks/courses/useProgressionAnalytics';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ProgressionAnalyticsDashboardProps {
  courseId: string;
}

export const ProgressionAnalyticsDashboard = ({ courseId }: ProgressionAnalyticsDashboardProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const { data: analytics, isLoading: analyticsLoading } = useCourseProgressionAnalytics(
    courseId,
    30
  );
  const { data: snapshots, isLoading: snapshotsLoading } = useCourseProgressionSnapshots(
    courseId,
    selectedDate
  );

  const createSnapshotMutation = useCreateProgressionSnapshot();
  const calculateAnalyticsMutation = useCalculateCourseProgressionAnalytics();

  const handleCreateSnapshot = async () => {
    try {
      await createSnapshotMutation.mutateAsync();
      toast({
        title: 'Snapshot créé',
        description: 'Le snapshot de progression a été créé avec succès.',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de créer le snapshot',
        variant: 'destructive',
      });
    }
  };

  const handleCalculateAnalytics = async () => {
    try {
      await calculateAnalyticsMutation.mutateAsync({ courseId });
      toast({
        title: 'Analytics calculées',
        description: 'Les analytics de progression ont été calculées avec succès.',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de calculer les analytics',
        variant: 'destructive',
      });
    }
  };

  if (analyticsLoading || snapshotsLoading) {
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

  // Dernières analytics disponibles
  const latestAnalytics =
    analytics && analytics.length > 0 ? analytics[analytics.length - 1] : null;
  const previousAnalytics =
    analytics && analytics.length > 1 ? analytics[analytics.length - 2] : null;

  // Calculer les tendances
  const progressTrend =
    latestAnalytics && previousAnalytics
      ? latestAnalytics.average_progress - previousAnalytics.average_progress
      : 0;
  const enrollmentTrend =
    latestAnalytics && previousAnalytics
      ? latestAnalytics.total_enrollments - previousAnalytics.total_enrollments
      : 0;

  // Distribution de progression
  const progressionDistribution = latestAnalytics
    ? [
        { name: '0-25%', value: latestAnalytics.students_0_25_percent, color: '#ef4444' },
        { name: '25-50%', value: latestAnalytics.students_25_50_percent, color: '#f59e0b' },
        { name: '50-75%', value: latestAnalytics.students_50_75_percent, color: '#3b82f6' },
        { name: '75-100%', value: latestAnalytics.students_75_100_percent, color: '#10b981' },
        { name: 'Complété', value: latestAnalytics.students_completed, color: '#22c55e' },
      ]
    : [];

  // Données pour graphique de progression dans le temps
  const progressionTimeline =
    analytics?.map(a => ({
      date: a.analytics_date,
      average: a.average_progress,
      median: a.median_progress,
      completed: a.completed_enrollments,
      active: a.active_enrollments,
    })) || [];

  // KPIs principaux
  const kpis = [
    {
      title: 'Progression Moyenne',
      value: latestAnalytics ? `${latestAnalytics.average_progress.toFixed(1)}%` : '0%',
      change: progressTrend,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Étudiants Actifs',
      value: latestAnalytics?.active_enrollments.toLocaleString() || '0',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Complétions',
      value: latestAnalytics?.completed_enrollments.toLocaleString() || '0',
      change: enrollmentTrend,
      icon: CheckCircle2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Temps de Visionnage Moyen',
      value: latestAnalytics
        ? `${Math.round(latestAnalytics.average_watch_time_minutes)} min`
        : '0 min',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de Progression</h2>
          <p className="text-muted-foreground">Suivi détaillé de la progression des étudiants</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateSnapshot}
            disabled={createSnapshotMutation.isPending}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${createSnapshotMutation.isPending ? 'animate-spin' : ''}`}
            />
            Créer Snapshot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculateAnalytics}
            disabled={calculateAnalyticsMutation.isPending}
          >
            <BarChart3
              className={`w-4 h-4 mr-2 ${calculateAnalyticsMutation.isPending ? 'animate-spin' : ''}`}
            />
            Calculer Analytics
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change && kpi.change > 0;
          const isNegative = kpi.change && kpi.change < 0;

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      {kpi.change !== undefined && kpi.change !== 0 && (
                        <Badge
                          variant={isPositive ? 'default' : 'destructive'}
                          className={`text-xs ${
                            isPositive
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {Math.abs(kpi.change).toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs pour différentes vues */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="timeline">Évolution</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {latestAnalytics ? (
            <>
              {/* Graphique de progression dans le temps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Évolution de la Progression
                  </CardTitle>
                  <CardDescription>
                    Progression moyenne et médiane sur les 30 derniers jours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {progressionTimeline.length > 0 ? (
                    <LazyRechartsWrapper>
                      {recharts => (
                        <recharts.ResponsiveContainer width="100%" height={300}>
                          <recharts.LineChart data={progressionTimeline}>
                            <recharts.CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <recharts.XAxis
                              dataKey="date"
                              tickFormatter={value => {
                                const date = new Date(value);
                                return date.toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                });
                              }}
                              stroke="#888"
                            />
                            <recharts.YAxis stroke="#888" domain={[0, 100]} />
                            <recharts.Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                              }}
                            />
                            <recharts.Legend />
                            <recharts.Line
                              type="monotone"
                              dataKey="average"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="Progression moyenne"
                              dot={{ fill: '#3b82f6', r: 4 }}
                            />
                            <recharts.Line
                              type="monotone"
                              dataKey="median"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Progression médiane"
                              dot={{ fill: '#10b981', r: 4 }}
                            />
                          </recharts.LineChart>
                        </recharts.ResponsiveContainer>
                      )}
                    </LazyRechartsWrapper>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune donnée disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Métriques détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métriques de Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Score Quiz Moyen</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.average_quiz_score
                          ? `${latestAnalytics.average_quiz_score.toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taux de Réussite</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.pass_rate
                          ? `${latestAnalytics.pass_rate.toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Notes Moyennes/Étudiant</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.average_notes_per_student.toFixed(1)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métriques d'Engagement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Étudiants Actifs (7j)</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.active_students_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taux de Rétention (7j)</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.retention_rate_7d
                          ? `${latestAnalytics.retention_rate_7d.toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taux d'Abandon</span>
                      <span className="text-lg font-semibold">
                        {latestAnalytics.dropout_rate
                          ? `${latestAnalytics.dropout_rate.toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucune donnée d'analytics disponible. Créez un snapshot pour commencer.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Évolution */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Inscriptions et Complétions</CardTitle>
              <CardDescription>
                Nombre d'inscriptions actives et complétions dans le temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressionTimeline.length > 0 ? (
                <LazyRechartsWrapper>
                  {recharts => (
                    <recharts.ResponsiveContainer width="100%" height={300}>
                      <recharts.AreaChart data={progressionTimeline}>
                        <recharts.CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <recharts.XAxis
                          dataKey="date"
                          tickFormatter={value => {
                            const date = new Date(value);
                            return date.toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                            });
                          }}
                          stroke="#888"
                        />
                        <recharts.YAxis stroke="#888" />
                        <recharts.Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                          }}
                        />
                        <recharts.Legend />
                        <recharts.Area
                          type="monotone"
                          dataKey="active"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                          name="Actifs"
                        />
                        <recharts.Area
                          type="monotone"
                          dataKey="completed"
                          stackId="1"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.6}
                          name="Complétés"
                        />
                      </recharts.AreaChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution de Progression</CardTitle>
              <CardDescription>Répartition des étudiants par niveau de progression</CardDescription>
            </CardHeader>
            <CardContent>
              {progressionDistribution.some(d => d.value > 0) ? (
                <LazyRechartsWrapper>
                  {recharts => (
                    <recharts.ResponsiveContainer width="100%" height={300}>
                      <recharts.BarChart data={progressionDistribution}>
                        <recharts.CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <recharts.XAxis dataKey="name" stroke="#888" />
                        <recharts.YAxis stroke="#888" />
                        <recharts.Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                          }}
                        />
                        <recharts.Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                          {progressionDistribution.map((entry, index) => (
                            <recharts.Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </recharts.Bar>
                      </recharts.BarChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots */}
        <TabsContent value="snapshots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Snapshots de Progression</CardTitle>
              <CardDescription>Derniers snapshots de progression des étudiants</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots && snapshots.length > 0 ? (
                <div className="space-y-4">
                  {snapshots.slice(0, 10).map(snapshot => (
                    <div
                      key={snapshot.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {snapshot.progress_percentage.toFixed(1)}% complété
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {snapshot.completed_lessons} / {snapshot.total_lessons} leçons •{' '}
                          {Math.round(snapshot.total_watch_time_minutes)} min de visionnage
                        </p>
                      </div>
                      <Badge variant="outline">{snapshot.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun snapshot disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};






