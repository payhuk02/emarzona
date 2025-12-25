/**
 * Email Analytics Dashboard
 * Dashboard complet pour les analytics d'emailing
 * Date: 2 Février 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { emailAnalyticsService } from '@/lib/email/email-analytics-service';
import {
  Loader2,
  RefreshCw,
  Mail,
  Eye,
  MousePointerClick,
  XCircle,
  DollarSign,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface StoreAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  revenue: number;
}

export function EmailAnalyticsDashboard({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, campaignsData] = await Promise.all([
        emailAnalyticsService.getStoreAnalytics(storeId, startDate, endDate),
        emailAnalyticsService.getCampaignPerformance(storeId, startDate, endDate),
      ]);

      setAnalytics(analyticsData);
      setCampaigns(campaignsData);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du chargement des analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [storeId, startDate, endDate]);

  const chartData = campaigns.slice(0, 10).map((campaign) => ({
    name: campaign.campaign_name.length > 20
      ? campaign.campaign_name.substring(0, 20) + '...'
      : campaign.campaign_name,
    Envoyés: campaign.sent,
    Livrés: campaign.delivered,
    Ouverts: campaign.opened,
    Clics: campaign.clicked,
  }));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Email</h2>
          <p className="text-muted-foreground">
            Statistiques et performances de vos campagnes email
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date" className="text-sm">
              Du:
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="end-date" className="text-sm">
              Au:
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={loadAnalytics} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : analytics ? (
        <>
          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Envoyés</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_sent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Taux de livraison: {analytics.delivery_rate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.open_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_opened.toLocaleString()} ouverts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.click_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_clicked.toLocaleString()} clics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Rebond</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.bounce_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_bounced.toLocaleString()} rebonds
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
              <TabsTrigger value="performance">Performances</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Campagnes</CardTitle>
                  <CardDescription>Performances des meilleures campagnes</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune campagne trouvée
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Envoyés" fill="#8884d8" />
                        <Bar dataKey="Livrés" fill="#82ca9d" />
                        <Bar dataKey="Ouverts" fill="#ffc658" />
                        <Bar dataKey="Clics" fill="#ff7300" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Détails des Campagnes</CardTitle>
                    <CardDescription>Liste complète avec métriques</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.campaign_id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{campaign.campaign_name}</h4>
                            {campaign.revenue > 0 && (
                              <Badge variant="default">
                                <DollarSign className="mr-1 h-3 w-3" />
                                {campaign.revenue.toLocaleString()} €
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Livraison: </span>
                              <span className="font-medium">
                                {campaign.delivery_rate.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ouverture: </span>
                              <span className="font-medium">{campaign.open_rate.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Clic: </span>
                              <span className="font-medium">{campaign.click_rate.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Envoyés: </span>
                              <span className="font-medium">{campaign.sent.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
