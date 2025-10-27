/**
 * Dashboard Analytics pour instructeurs de cours
 * Affichage des métriques, graphiques et insights
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useCourseAnalytics, useCourseViewsTimeline } from '@/hooks/courses/useCourseAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CourseAnalyticsDashboardProps {
  productId: string;
}

export const CourseAnalyticsDashboard = ({ productId }: CourseAnalyticsDashboardProps) => {
  const { data: analytics, isLoading: analyticsLoading } = useCourseAnalytics(productId);
  const { data: timeline, isLoading: timelineLoading } = useCourseViewsTimeline(productId, 7);

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

  if (!analytics) {
    return null;
  }

  // KPIs principaux
  const kpis = [
    {
      title: 'Vues Totales',
      value: analytics.total_views.toLocaleString(),
      change: analytics.views_trend,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clics',
      value: analytics.total_clicks.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Inscriptions',
      value: analytics.total_enrollments.toLocaleString(),
      change: analytics.enrollments_trend,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Taux de Conversion',
      value: `${analytics.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
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
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {kpi.title}
                    </p>
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
                            <ArrowUp className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowDown className="w-3 h-3 mr-1" />
                          )}
                          {Math.abs(kpi.change).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    {kpi.change !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">vs hier</p>
                    )}
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

      {/* Graphique Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Vues des 7 derniers jours
          </CardTitle>
          <CardDescription>
            Évolution des visites sur votre cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeline && timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                  }}
                  stroke="#888"
                />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    });
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Vues"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune donnée disponible pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats d'aujourd'hui */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aujourd'hui</CardTitle>
            <CardDescription>Performance en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-muted-foreground">Vues aujourd'hui</span>
              </div>
              <span className="text-xl font-bold">{analytics.views_today}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-muted-foreground">Inscriptions aujourd'hui</span>
              </div>
              <span className="text-xl font-bold">{analytics.enrollments_today}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights</CardTitle>
            <CardDescription>Analyse rapide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.conversion_rate > 5 ? (
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Excellent taux de conversion !
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Votre cours convertit bien ({'>'}
{analytics.conversion_rate}%)
                  </p>
                </div>
              </div>
            ) : analytics.conversion_rate > 2 ? (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Bon taux de conversion</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {analytics.conversion_rate}% des visiteurs s'inscrivent
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    Amélioration possible
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Optimisez description et vidéo preview
                  </p>
                </div>
              </div>
            )}

            {analytics.views_trend > 20 && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Croissance forte !</p>
                  <p className="text-xs text-purple-700 mt-1">
                    +{analytics.views_trend.toFixed(0)}% de vues vs hier
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
