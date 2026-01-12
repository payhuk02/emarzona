import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Mail,
  Smartphone,
  Bell,
  MessageSquare,
  TrendingUp,
  Target,
  Eye,
  DollarSign,
  Plus,
  Settings,
  Play,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AbandonedCartRecovery } from './AbandonedCartRecovery';

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  type: 'email' | 'push' | 'in_app' | 'sms';
  status: 'active' | 'paused' | 'draft';
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MarketingAutomationDashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch campaign statistics - using mock data for now
  const { data: stats, isLoading: statsLoading } = useQuery<CampaignStats>({
    queryKey: ['marketing-stats', selectedTimeframe],
    queryFn: async () => {
      // Mock data until the RPC function is implemented
      return {
        totalCampaigns: 12,
        activeCampaigns: 8,
        totalSends: 45230,
        totalOpens: 12345,
        totalClicks: 2345,
        totalConversions: 456,
        totalRevenue: 1250000,
        averageOpenRate: 27.3,
        averageClickRate: 19.0,
        averageConversionRate: 1.0,
      };
    },
  });

  // Fetch campaign performances - using mock data for now
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignPerformance[]>({
    queryKey: ['campaign-performances', selectedTimeframe],
    queryFn: async () => {
      // Mock data until the view is implemented
      return [
        {
          id: '1',
          name: 'Campagne Newsletter Janvier',
          type: 'email' as const,
          status: 'active' as const,
          sent: 15420,
          opens: 4210,
          clicks: 842,
          conversions: 156,
          revenue: 468000,
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Push Notification Soldes',
          type: 'push' as const,
          status: 'active' as const,
          sent: 8920,
          opens: 3568,
          clicks: 534,
          conversions: 89,
          revenue: 267000,
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '3',
          name: 'SMS Promotion',
          type: 'sms' as const,
          status: 'paused' as const,
          sent: 2340,
          opens: 1872,
          clicks: 234,
          conversions: 35,
          revenue: 105000,
          created_at: '2025-01-20T00:00:00Z',
        },
      ];
    },
  });

  // Fetch behavioral data for charts - using mock data for now
  const { data: behavioralData, isLoading: behavioralLoading } = useQuery({
    queryKey: ['behavioral-analytics', selectedTimeframe],
    queryFn: async () => {
      // Mock data until the RPC function is implemented
      const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      const mockData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          page_views: Math.floor(Math.random() * 1000) + 500,
          product_views: Math.floor(Math.random() * 500) + 200,
          cart_adds: Math.floor(Math.random() * 100) + 20,
          purchases: Math.floor(Math.random() * 20) + 5,
        });
      }

      return mockData;
    },
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Smartphone className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const performanceData = useMemo(() => {
    if (!behavioralData || !Array.isArray(behavioralData)) return [];

    return behavioralData.map((item: unknown) => {
      const data = item as {
        date: string;
        page_views: number;
        product_views: number;
        cart_adds: number;
        purchases: number;
      };
      return {
        date: data.date,
        pageViews: data.page_views,
        productViews: data.product_views,
        cartAdds: data.cart_adds,
        purchases: data.purchases,
      };
    });
  }, [behavioralData]);

  const channelDistribution = useMemo(() => {
    if (!campaigns || !Array.isArray(campaigns)) return [];

    const channels = campaigns.reduce(
      (acc: Record<string, number>, campaign: CampaignPerformance) => {
        acc[campaign.type] = (acc[campaign.type] || 0) + campaign.sent;
        return acc;
      },
      {}
    );

    return Object.entries(channels).map(([channel, sent]) => ({
      name: channel,
      value: sent,
    }));
  }, [campaigns]);

  if (statsLoading || campaignsLoading || behavioralLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Automation</h1>
          <p className="text-muted-foreground">
            Gérez vos campagnes marketing automatisées et analysez les performances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Période:</span>
        {(['7d', '30d', '90d'] as const).map(timeframe => (
          <Button
            key={timeframe}
            variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe(timeframe)}
          >
            {timeframe === '7d' ? '7 jours' : timeframe === '30d' ? '30 jours' : '90 jours'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes actives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">sur {stats?.totalCampaigns || 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalSends || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Taux d'ouverture: {stats?.averageOpenRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalConversions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Taux de conversion: {stats?.averageConversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus générés</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalRevenue || 0).toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">
              ROI moyen:{' '}
              {stats?.totalRevenue && stats?.totalSends
                ? ((stats.totalRevenue / stats.totalSends) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
          <TabsTrigger value="abandoned-carts">Paniers abandonnés</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des performances</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pageViews"
                      stroke="#8884d8"
                      name="Vues de page"
                    />
                    <Line
                      type="monotone"
                      dataKey="productViews"
                      stroke="#82ca9d"
                      name="Vues produit"
                    />
                    <Line
                      type="monotone"
                      dataKey="cartAdds"
                      stroke="#ffc658"
                      name="Ajouts panier"
                    />
                    <Line type="monotone" dataKey="purchases" stroke="#ff7300" name="Achats" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {channelDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(campaigns || []).map((campaign: CampaignPerformance) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getChannelIcon(campaign.type)}
                      <div>
                        <p className="font-semibold">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(campaign.status)}
                          <span className="text-sm text-muted-foreground">
                            {campaign.sent.toLocaleString()} envoyés
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Ouvertures</p>
                        <p className="text-lg font-bold">{campaign.opens.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.sent > 0
                            ? ((campaign.opens / campaign.sent) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Clics</p>
                        <p className="text-lg font-bold">{campaign.clicks.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.opens > 0
                            ? ((campaign.clicks / campaign.opens) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Conversions</p>
                        <p className="text-lg font-bold">{campaign.conversions.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.sent > 0
                            ? ((campaign.conversions / campaign.sent) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyse comportementale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analyse des comportements utilisateurs pour optimiser vos campagnes marketing.
                </p>
                {/* Add behavioral analytics components here */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segments utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Clients haute valeur', count: 1250, percentage: 15 },
                    { name: 'Acheteurs récurrents', count: 2100, percentage: 25 },
                    { name: 'Nouveaux clients', count: 850, percentage: 10 },
                    { name: 'Visiteurs occasionnels', count: 3200, percentage: 40 },
                  ].map(segment => (
                    <div key={segment.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{segment.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={segment.percentage} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {segment.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="abandoned-carts" className="space-y-4">
          <AbandonedCartRecovery showAdminControls={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
