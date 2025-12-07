/**
 * Composant Dashboard Analytics Email
 * Date: 1er Février 2025
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { 
  Mail, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  XCircle, 
  UserX, 
  TrendingUp,
  DollarSign,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { useEmailAnalyticsDaily, useEmailAnalyticsSummary, useCalculateDailyAnalytics } from '@/hooks/email/useEmailAnalytics';
import type { EmailAnalyticsFilters } from '@/lib/email/email-analytics-service';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface EmailAnalyticsDashboardProps {
  storeId: string;
  filters?: {
    campaignId?: string;
    sequenceId?: string;
    templateId?: string;
  };
}

type PeriodType = '7d' | '30d' | '90d' | '1y';

export const EmailAnalyticsDashboard = ({ 
  storeId, 
  filters = {} 
}: EmailAnalyticsDashboardProps) => {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateFrom, setDateFrom] = useState(() => {
    return format(subDays(new Date(), 29), 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  const analyticsFilters: EmailAnalyticsFilters = useMemo(() => ({
    storeId,
    campaignId: filters.campaignId,
    sequenceId: filters.sequenceId,
    templateId: filters.templateId,
    dateFrom,
    dateTo,
  }), [storeId, filters.campaignId, filters.sequenceId, filters.templateId, dateFrom, dateTo]);

  const { data: dailyAnalytics, isLoading: dailyLoading } = useEmailAnalyticsDaily(analyticsFilters);
  const { data: summary, isLoading: summaryLoading } = useEmailAnalyticsSummary(analyticsFilters);
  const calculateAnalytics = useCalculateDailyAnalytics();

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    const days = newPeriod === '7d' ? 7 : newPeriod === '30d' ? 30 : newPeriod === '90d' ? 90 : 365;
    setDateFrom(format(subDays(new Date(), days - 1), 'yyyy-MM-dd'));
    setDateTo(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleRecalculate = async () => {
    await calculateAnalytics.mutateAsync({ storeId });
  };

  // Préparer les données pour les graphiques
  const chartData = useMemo(() => {
    if (!dailyAnalytics || dailyAnalytics.length === 0) return [];
    
    return dailyAnalytics.map((analytics) => ({
      date: format(new Date(analytics.date), 'dd MMM', { locale: fr }),
      fullDate: analytics.date,
      sent: analytics.total_sent,
      delivered: analytics.total_delivered,
      opened: analytics.total_opened,
      clicked: analytics.total_clicked,
      bounced: analytics.total_bounced,
      revenue: Number(analytics.revenue || 0),
      openRate: analytics.open_rate,
      clickRate: analytics.click_rate,
    })).reverse(); // Du plus ancien au plus récent
  }, [dailyAnalytics]);

  const isLoading = dailyLoading || summaryLoading;

  const statCards = [
    {
      label: 'Envoyés',
      value: summary?.total_sent || 0,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Livrés',
      value: summary?.total_delivered || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      rate: summary?.delivery_rate,
    },
    {
      label: 'Ouverts',
      value: summary?.total_opened || 0,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      rate: summary?.open_rate,
    },
    {
      label: 'Clics',
      value: summary?.total_clicked || 0,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      rate: summary?.click_rate,
    },
    {
      label: 'Rebonds',
      value: summary?.total_bounced || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      rate: summary?.bounce_rate,
    },
    {
      label: 'Revenus',
      value: summary?.revenue || 0,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header avec sélection de période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Email</h2>
          <p className="text-muted-foreground">
            Analysez les performances de vos emails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRecalculate}
            disabled={calculateAnalytics.isPending}
            title="Recalculer les analytics"
            aria-label="Recalculer les analytics"
          >
            {calculateAnalytics.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.rate !== undefined && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.rate.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {stat.isCurrency
                    ? (stat.value / 100).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                      })
                    : stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {stat.rate !== undefined && (
                  <Progress value={stat.rate} className="mt-2 h-2" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
        </TabsList>

        {/* Graphique de Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance des emails</CardTitle>
              <CardDescription>
                Évolution du nombre d'emails envoyés, livrés, ouverts et cliqués
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée disponible pour cette période</p>
                  </div>
                </div>
              ) : (
                <LazyRechartsWrapper>
                  {(recharts) => (
                    <recharts.ResponsiveContainer width="100%" height={400}>
                      <recharts.LineChart data={chartData}>
                        <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <recharts.XAxis 
                          dataKey="date"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <recharts.YAxis stroke="#9ca3af" fontSize={12} />
                        <recharts.Tooltip 
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <recharts.Legend />
                        <recharts.Line
                          type="monotone"
                          dataKey="sent"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          name="Envoyés"
                        />
                        <recharts.Line
                          type="monotone"
                          dataKey="delivered"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          name="Livrés"
                        />
                        <recharts.Line
                          type="monotone"
                          dataKey="opened"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          name="Ouverts"
                        />
                        <recharts.Line
                          type="monotone"
                          dataKey="clicked"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          name="Clics"
                        />
                      </recharts.LineChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique d'Engagement */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Taux d'engagement</CardTitle>
              <CardDescription>
                Taux d'ouverture et de clic au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune donnée disponible pour cette période</p>
                  </div>
                </div>
              ) : (
                <LazyRechartsWrapper>
                  {(recharts) => (
                    <recharts.ResponsiveContainer width="100%" height={400}>
                      <recharts.LineChart data={chartData}>
                        <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <recharts.XAxis 
                          dataKey="date"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <recharts.YAxis 
                          stroke="#9ca3af" 
                          fontSize={12}
                          label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <recharts.Tooltip 
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <recharts.Legend />
                        <recharts.Line
                          type="monotone"
                          dataKey="openRate"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          name="Taux d'ouverture (%)"
                        />
                        <recharts.Line
                          type="monotone"
                          dataKey="clickRate"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          name="Taux de clic (%)"
                        />
                      </recharts.LineChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique de Revenus */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenus générés</CardTitle>
              <CardDescription>
                Revenus générés par les campagnes email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 || chartData.every(d => d.revenue === 0) ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun revenu enregistré pour cette période</p>
                  </div>
                </div>
              ) : (
                <LazyRechartsWrapper>
                  {(recharts) => (
                    <recharts.ResponsiveContainer width="100%" height={400}>
                      <recharts.BarChart data={chartData}>
                        <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <recharts.XAxis 
                          dataKey="date"
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <recharts.YAxis 
                          stroke="#9ca3af" 
                          fontSize={12}
                          label={{ value: 'Revenus (XOF)', angle: -90, position: 'insideLeft' }}
                        />
                        <recharts.Tooltip 
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => 
                            (value / 100).toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            })
                          }
                        />
                        <recharts.Legend />
                        <recharts.Bar
                          dataKey="revenue"
                          fill="#10b981"
                          name="Revenus (XOF)"
                        />
                      </recharts.BarChart>
                    </recharts.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

