import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
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
  Pause,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AbandonedCartRecovery } from './AbandonedCartRecovery';
import { SegmentBuilder, RuleGroup } from './SegmentBuilder';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignPerformance | null>(null);
  
  // States for forms
  const [settings, setSettings] = useState({
    defaultSenderName: 'Emarzona',
    defaultSenderEmail: 'contact@emarzona.com',
    maxEmailsPerDay: 2,
    enableSms: false,
    enablePush: true,
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as const,
    trigger: 'behavioral' as const,
    is_active: true,
  });
  
  const [newSegment, setNewSegment] = useState<{name: string, rules: RuleGroup}>({
    name: '',
    rules: {
      id: 'root',
      condition: 'AND',
      rules: []
    },
  });

  // Fetch campaign statistics
  const { data: stats, isLoading: statsLoading } = useQuery<CampaignStats>({
    queryKey: ['marketing-stats', selectedTimeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_marketing_campaign_stats', { timeframe: selectedTimeframe });
      
      if (error) {
        console.error('Error fetching marketing stats:', error);
        throw error;
      }
      
      const res = data?.[0] || {};
      
      return {
        totalCampaigns: Number(res.total_campaigns || 0),
        activeCampaigns: Number(res.active_campaigns || 0),
        totalSends: Number(res.total_sends || 0),
        totalOpens: Number(res.total_opens || 0),
        totalClicks: Number(res.total_clicks || 0),
        totalConversions: Number(res.total_conversions || 0),
        totalRevenue: Number(res.total_revenue || 0),
        averageOpenRate: Number(res.average_open_rate || 0),
        averageClickRate: Number(res.average_click_rate || 0),
        averageConversionRate: Number(res.average_conversion_rate || 0),
      };
    },
  });

  // Fetch campaign performances
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignPerformance[]>({
    queryKey: ['campaign-performances', selectedTimeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(`
          id,
          name,
          type,
          is_active,
          created_at,
          campaign_performance (
            sent_count,
            open_count,
            click_count,
            conversion_count,
            revenue_generated
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }

      return (data || []).map((campaign: any) => {
        const perf = campaign.campaign_performance?.[0] || {};
        return {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type as 'email' | 'push' | 'in_app' | 'sms',
          status: campaign.is_active ? 'active' : 'paused',
          sent: perf.sent_count || 0,
          opens: perf.open_count || 0,
          clicks: perf.click_count || 0,
          conversions: perf.conversion_count || 0,
          revenue: perf.revenue_generated || 0,
          created_at: campaign.created_at,
        };
      });
    },
  });

  // Fetch behavioral data for charts
  const { data: behavioralData, isLoading: behavioralLoading } = useQuery({
    queryKey: ['behavioral-analytics', selectedTimeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_behavioral_analytics_summary', { timeframe: selectedTimeframe });
        
      if (error) {
        console.error('Error fetching behavioral data:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch user segments
  const { data: userSegments, isLoading: segmentsLoading } = useQuery({
    queryKey: ['user-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_segments')
        .select('*')
        .order('user_count', { ascending: false });

      if (error) {
        console.error('Error fetching user segments:', error);
        throw error;
      }

      return data || [];
    },
  });

  // Mutations
  const createCampaign = useMutation({
    mutationFn: async (campaign: any) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([campaign])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-performances'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast({ title: 'Campagne créée avec succès' });
      setIsCampaignDialogOpen(false);
      setNewCampaign({ name: '', type: 'email', trigger: 'behavioral', is_active: true });
    },
    onError: (error) => {
      toast({ title: 'Erreur lors de la création', description: error.message, variant: 'destructive' });
    }
  });

  const toggleCampaignStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-performances'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
      toast({ title: 'Statut mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const createSegment = useMutation({
    mutationFn: async (segment: {name: string, rules: RuleGroup}) => {
      const { data, error } = await supabase
        .from('user_segments')
        .insert([{ name: segment.name, criteria: segment.rules, user_count: 0 }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-segments'] });
      toast({ title: 'Segment créé avec succès' });
      setIsSegmentDialogOpen(false);
      setNewSegment({ name: '', rules: { id: 'root', condition: 'AND', rules: [] } });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
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

    return behavioralData.map((data: any) => {
      return {
        date: data.date,
        pageViews: Number(data.page_views || 0),
        productViews: Number(data.product_views || 0),
        cartAdds: Number(data.cart_adds || 0),
        purchases: Number(data.purchases || 0),
      };
    }).reverse();
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
          <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button size="sm" onClick={() => setIsCampaignDialogOpen(true)}>
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
                <LazyRechartsWrapper>
                  {R => (
                    <R.ResponsiveContainer width="100%" height={300}>
                      <R.LineChart data={performanceData}>
                        <R.CartesianGrid strokeDasharray="3 3" />
                        <R.XAxis dataKey="date" />
                        <R.YAxis />
                        <R.Tooltip />
                        <R.Legend />
                        <R.Line
                          type="monotone"
                          dataKey="pageViews"
                          stroke="#8884d8"
                          name="Vues de page"
                        />
                        <R.Line
                          type="monotone"
                          dataKey="productViews"
                          stroke="#82ca9d"
                          name="Vues produit"
                        />
                        <R.Line
                          type="monotone"
                          dataKey="cartAdds"
                          stroke="#ffc658"
                          name="Ajouts panier"
                        />
                        <R.Line
                          type="monotone"
                          dataKey="purchases"
                          stroke="#ff7300"
                          name="Achats"
                        />
                      </R.LineChart>
                    </R.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par canal</CardTitle>
              </CardHeader>
              <CardContent>
                <LazyRechartsWrapper>
                  {R => (
                    <R.ResponsiveContainer width="100%" height={300}>
                      <R.PieChart>
                        <R.Pie
                          data={channelDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {channelDistribution.map((_, index) => (
                            <R.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </R.Pie>
                        <R.Tooltip />
                      </R.PieChart>
                    </R.ResponsiveContainer>
                  )}
                </LazyRechartsWrapper>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Voir les détails"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title={campaign.status === 'active' ? "Mettre en pause" : "Activer"}
                          onClick={() => toggleCampaignStatus.mutate({ id: campaign.id, is_active: campaign.status !== 'active' })}
                          disabled={toggleCampaignStatus.isPending}
                        >
                          {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Segments utilisateurs</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsSegmentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nouveau
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {segmentsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Chargement des segments...</div>
                  ) : userSegments && userSegments.length > 0 ? (
                    userSegments.map((segment: any) => {
                      const totalUsers = userSegments.reduce((sum: number, s: any) => sum + (s.user_count || 0), 0) || 1;
                      const percentage = Math.round(((segment.user_count || 0) / totalUsers) * 100);
                      return (
                        <div key={segment.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{segment.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={percentage} className="flex-1" />
                              <span className="text-sm text-muted-foreground">
                                {(segment.user_count || 0).toLocaleString()} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">Aucun segment trouvé</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="abandoned-carts" className="space-y-4">
          <AbandonedCartRecovery showAdminControls={true} />
        </TabsContent>
      </Tabs>

      {/* New Campaign Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle campagne</DialogTitle>
            <DialogDescription>
              Configurez les détails de votre nouvelle campagne marketing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la campagne</Label>
              <Input
                placeholder="Ex: Promo Hiver 2026"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newCampaign.type}
                onValueChange={(value: any) => setNewCampaign({ ...newCampaign, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Notification Push</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="in_app">Message In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Déclencheur (Trigger)</Label>
              <Select
                value={newCampaign.trigger}
                onValueChange={(value: any) => setNewCampaign({ ...newCampaign, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un déclencheur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Comportemental (ex: page vue)</SelectItem>
                  <SelectItem value="time_based">Basé sur le temps</SelectItem>
                  <SelectItem value="event_based">Basé sur un événement</SelectItem>
                  <SelectItem value="segment_based">Basé sur un segment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Activer immédiatement</Label>
              <Switch
                checked={newCampaign.is_active}
                onCheckedChange={(checked) => setNewCampaign({ ...newCampaign, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => createCampaign.mutate(newCampaign)}
              disabled={createCampaign.isPending || !newCampaign.name}
            >
              Créer la campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Segment Dialog */}
      <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau segment</DialogTitle>
            <DialogDescription>
              Définissez les règles pour grouper vos utilisateurs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du segment</Label>
              <Input
                placeholder="Ex: Utilisateurs inactifs depuis 30 jours"
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Règles de segmentation</Label>
              <div className="pt-2">
                <SegmentBuilder
                  value={newSegment.rules}
                  onChange={(rules) => setNewSegment({ ...newSegment, rules })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSegmentDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => createSegment.mutate(newSegment)}
              disabled={createSegment.isPending || !newSegment.name}
            >
              Enregistrer le segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la campagne : {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Aperçu complet des performances pour cette campagne.
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedCampaign.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div>{getStatusBadge(selectedCampaign.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Envoyés</p>
                  <p className="font-medium text-lg">{selectedCampaign.sent.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedCampaign.sent > 0 ? ((selectedCampaign.opens / selectedCampaign.sent) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedCampaign.opens.toLocaleString()} vues</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-orange-500">
                      {selectedCampaign.opens > 0 ? ((selectedCampaign.clicks / selectedCampaign.opens) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux de clic</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedCampaign.clicks.toLocaleString()} clics</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedCampaign.sent > 0 ? ((selectedCampaign.conversions / selectedCampaign.sent) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux de conversion</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedCampaign.conversions.toLocaleString()} achats</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedCampaign(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres Marketing Automation</DialogTitle>
            <DialogDescription>
              Configurez vos préférences d'envoi et règles globales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom d'expéditeur par défaut</Label>
              <Input
                value={settings.defaultSenderName}
                onChange={(e) => setSettings({ ...settings, defaultSenderName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email d'expéditeur par défaut</Label>
              <Input
                type="email"
                value={settings.defaultSenderEmail}
                onChange={(e) => setSettings({ ...settings, defaultSenderEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite d'emails par jour par utilisateur</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.maxEmailsPerDay}
                onChange={(e) => setSettings({ ...settings, maxEmailsPerDay: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Activer l'envoi de SMS</Label>
                <p className="text-xs text-muted-foreground">Nécessite une API configurée (ex: Twilio)</p>
              </div>
              <Switch
                checked={settings.enableSms}
                onCheckedChange={(checked) => setSettings({ ...settings, enableSms: checked })}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Activer les Notifications Push</Label>
                <p className="text-xs text-muted-foreground">Pour les utilisateurs avec l'app web installée (PWA)</p>
              </div>
              <Switch
                checked={settings.enablePush}
                onCheckedChange={(checked) => setSettings({ ...settings, enablePush: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => {
                toast({ title: 'Paramètres sauvegardés' });
                setIsSettingsDialogOpen(false);
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
