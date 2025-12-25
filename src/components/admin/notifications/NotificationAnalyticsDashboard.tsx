/**
 * Dashboard Analytics - Notifications
 * Date: 2 Février 2025
 *
 * Dashboard complet pour analyser les performances des notifications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getNotificationStats } from '@/lib/notifications/notification-logger';
import { supabase } from '@/integrations/supabase/client';
import { Bell, TrendingUp, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
}

interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface TypeStats {
  type: string;
  count: number;
  deliveryRate: number;
  openRate: number;
}

export const NotificationAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStats[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [_selectedChannel, _setSelectedChannel] = useState<string>('all');

  const loadStats = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'all':
          startDate.setFullYear(2020); // Date très ancienne
          break;
      }

      // Charger les statistiques globales
      const globalStats = await getNotificationStats({
        startDate,
        endDate,
      });
      setStats(globalStats);

      // Charger les statistiques par canal
      const { data: channelData } = await supabase
        .from('notification_logs')
        .select('channel, status')
        .gte('sent_at', startDate.toISOString())
        .lte('sent_at', endDate.toISOString())
        .then(({ data }) => {
          const channels = ['in_app', 'email', 'sms', 'push'];
          return channels.map(channel => {
            const channelLogs = data?.filter(log => log.channel === channel) || [];
            return {
              channel,
              sent: channelLogs.length,
              delivered: channelLogs.filter(log =>
                ['delivered', 'opened', 'clicked'].includes(log.status)
              ).length,
              opened: channelLogs.filter(log => ['opened', 'clicked'].includes(log.status)).length,
              clicked: channelLogs.filter(log => log.status === 'clicked').length,
              failed: channelLogs.filter(log => ['failed', 'bounced'].includes(log.status)).length,
            };
          });
        });

      setChannelStats(channelData || []);

      // Charger les statistiques par type
      const { data: typeData } = await supabase
        .from('notification_logs')
        .select('notification_type, status')
        .gte('sent_at', startDate.toISOString())
        .lte('sent_at', endDate.toISOString())
        .then(({ data }) => {
          const typeMap = new Map<string, { count: number; delivered: number; opened: number }>();

          data?.forEach(log => {
            const type = log.notification_type;
            if (!typeMap.has(type)) {
              typeMap.set(type, { count: 0, delivered: 0, opened: 0 });
            }
            const stats = typeMap.get(type)!;
            stats.count++;
            if (['delivered', 'opened', 'clicked'].includes(log.status)) {
              stats.delivered++;
            }
            if (['opened', 'clicked'].includes(log.status)) {
              stats.opened++;
            }
          });

          return Array.from(typeMap.entries())
            .map(([type, stats]) => ({
              type,
              count: stats.count,
              deliveryRate: stats.count > 0 ? (stats.delivered / stats.count) * 100 : 0,
              openRate: stats.count > 0 ? (stats.opened / stats.count) * 100 : 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        });

      setTypeStats(typeData || []);
    } catch (error) {
      logger.error('Error loading stats', { error });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Notifications</h2>
          <p className="text-muted-foreground">Statistiques et performances des notifications</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={timeRange}
            onValueChange={(value: '24h' | '7d' | '30d' | 'all') => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 dernières heures</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadStats} variant="outline">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envoyées</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalSent)}</div>
            <p className="text-xs text-muted-foreground">Toutes les notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Livraison</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.deliveryRate)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDelivered} livrées sur {stats.totalSent}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.openRate)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalOpened} ouvertes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.clickRate)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalClicked} clics</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Par Canal</TabsTrigger>
          <TabsTrigger value="types">Par Type</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par Canal</CardTitle>
              <CardDescription>
                Performance des notifications par canal de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill="#0088FE" name="Envoyées" />
                  <Bar dataKey="delivered" fill="#00C49F" name="Livrées" />
                  <Bar dataKey="opened" fill="#FFBB28" name="Ouvertes" />
                  <Bar dataKey="clicked" fill="#FF8042" name="Cliquées" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Types de Notifications</CardTitle>
              <CardDescription>Types de notifications les plus envoyés</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={typeStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Nombre" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taux de Livraison par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveryRate" fill="#00C49F" name="Taux de livraison (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux d'Ouverture par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="openRate" fill="#FFBB28" name="Taux d'ouverture (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par Canal</CardTitle>
          <CardDescription>Statistiques détaillées pour chaque canal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Canal</th>
                  <th className="text-right p-2">Envoyées</th>
                  <th className="text-right p-2">Livrées</th>
                  <th className="text-right p-2">Ouvertes</th>
                  <th className="text-right p-2">Cliquées</th>
                  <th className="text-right p-2">Échouées</th>
                  <th className="text-right p-2">Taux Livraison</th>
                </tr>
              </thead>
              <tbody>
                {channelStats.map(channel => (
                  <tr key={channel.channel} className="border-b">
                    <td className="p-2">
                      <Badge variant="outline">{channel.channel}</Badge>
                    </td>
                    <td className="text-right p-2">{formatNumber(channel.sent)}</td>
                    <td className="text-right p-2">{formatNumber(channel.delivered)}</td>
                    <td className="text-right p-2">{formatNumber(channel.opened)}</td>
                    <td className="text-right p-2">{formatNumber(channel.clicked)}</td>
                    <td className="text-right p-2 text-destructive">
                      {formatNumber(channel.failed)}
                    </td>
                    <td className="text-right p-2">
                      {channel.sent > 0
                        ? formatPercentage((channel.delivered / channel.sent) * 100)
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
