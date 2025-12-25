import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Download,
  RefreshCw
} from '@/components/icons';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface StoreAnalyticsProps {
  storeId: string;
}

interface AnalyticsData {
  totalViews: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  viewsGrowth: number;
  ordersGrowth: number;
  revenueGrowth: number;
  customersGrowth: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    sales_count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    views: number;
    orders: number;
    revenue: number;
  }>;
}

const StoreAnalytics = ({ storeId }: StoreAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculer les périodes pour comparaison de croissance
      const now = new Date();
      const currentPeriodStart = new Date(now);
      const currentPeriodEnd = now;
      
      // Période précédente (même durée)
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;
      
      if (timeRange === '7d') {
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodStart);
      } else if (timeRange === '30d') {
        currentPeriodStart.setDate(now.getDate() - 30);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
        previousPeriodEnd = new Date(currentPeriodStart);
      } else if (timeRange === '90d') {
        currentPeriodStart.setDate(now.getDate() - 90);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 90);
        previousPeriodEnd = new Date(currentPeriodStart);
      } else { // 1y
        currentPeriodStart.setFullYear(now.getFullYear() - 1);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        previousPeriodEnd = new Date(currentPeriodStart);
      }

      // Utiliser Promise.allSettled pour éviter les erreurs de requêtes individuelles
      const [
        productsResult, 
        ordersResult, 
        previousOrdersResult,
        customersResult, 
        previousCustomersResult,
        recentOrdersResult,
        viewsResult,
        previousViewsResult
      ] = await Promise.allSettled([
        supabase
          .from("products")
          .select("id, name, price, sales_count")
          .eq("store_id", storeId)
          .eq("is_active", true),
        
        supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("store_id", storeId)
          .gte("created_at", currentPeriodStart.toISOString())
          .lte("created_at", currentPeriodEnd.toISOString()),
        
        supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("store_id", storeId)
          .gte("created_at", previousPeriodStart.toISOString())
          .lt("created_at", previousPeriodEnd.toISOString()),
        
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
          .gte("created_at", currentPeriodStart.toISOString())
          .lte("created_at", currentPeriodEnd.toISOString()),
        
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
          .gte("created_at", previousPeriodStart.toISOString())
          .lt("created_at", previousPeriodEnd.toISOString()),
        
        supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(10),
        
        // Compter les vues depuis store_analytics_events (si la table existe)
        supabase
          .from("store_analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("event_type", "store_view")
          .gte("created_at", currentPeriodStart.toISOString())
          .lte("created_at", currentPeriodEnd.toISOString()),
        
        supabase
          .from("store_analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("event_type", "store_view")
          .gte("created_at", previousPeriodStart.toISOString())
          .lt("created_at", previousPeriodEnd.toISOString())
      ]);

      const products = productsResult.status === 'fulfilled' && productsResult.value.data ? productsResult.value.data : [];
      const orders = ordersResult.status === 'fulfilled' && ordersResult.value.data ? ordersResult.value.data : [];
      const previousOrders = previousOrdersResult.status === 'fulfilled' && previousOrdersResult.value.data ? previousOrdersResult.value.data : [];
      const customersCount = customersResult.status === 'fulfilled' && customersResult.value.count !== null ? customersResult.value.count : 0;
      const previousCustomersCount = previousCustomersResult.status === 'fulfilled' && previousCustomersResult.value.count !== null ? previousCustomersResult.value.count : 0;
      const recentOrders = recentOrdersResult.status === 'fulfilled' && recentOrdersResult.value.data ? recentOrdersResult.value.data : [];
      
      // Vues depuis store_analytics_events (0 si table n'existe pas ou pas de données)
      const totalViews = viewsResult.status === 'fulfilled' && viewsResult.value.count !== null ? viewsResult.value.count : 0;
      const previousViews = previousViewsResult.status === 'fulfilled' && previousViewsResult.value.count !== null ? previousViewsResult.value.count : 0;

      // Calculer les statistiques réelles
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
      const totalCustomers = customersCount;

      // Calculer la croissance depuis les données réelles
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100 * 100) / 100; // 2 décimales
      };

      const viewsGrowth = calculateGrowth(totalViews, previousViews);
      const ordersGrowth = calculateGrowth(totalOrders, previousOrders.length);
      
      const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
      const revenueGrowth = calculateGrowth(totalRevenue, previousRevenue);
      const customersGrowth = calculateGrowth(totalCustomers, previousCustomersCount);

      // Top produits - utiliser le sales_count réel de la DB (ou 0 si null)
      const topProducts = products
        .map(product => ({
          ...product,
          sales_count: product.sales_count || 0
        }))
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5);

      // Récupérer toutes les commandes (sans filtre de période) pour statistiques mensuelles
      const { data: allOrders } = await supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("store_id", storeId)
        .order("created_at", { ascending: true });

      // Récupérer toutes les vues (si store_analytics_events disponible)
      const { data: allViews } = await supabase
        .from("store_analytics_events")
        .select("created_at")
        .eq("store_id", storeId)
        .eq("event_type", "store_view")
        .order("created_at", { ascending: true });

      // Statistiques mensuelles depuis les données réelles (12 derniers mois)
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
        
        // Filtrer les commandes de ce mois depuis toutes les commandes
        const monthOrders = (allOrders || []).filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
        
        // Filtrer les vues de ce mois depuis toutes les vues
        const monthViews = (allViews || []).filter(view => {
          const viewDate = new Date(view.created_at);
          return viewDate >= monthStart && viewDate <= monthEnd;
        }).length;
        
        return {
          month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
          views: monthViews,
          orders: monthOrders.length,
          revenue: monthRevenue
        };
      });

      setAnalytics({
        totalViews,
        totalOrders,
        totalRevenue,
        totalCustomers,
        viewsGrowth,
        ordersGrowth,
        revenueGrowth,
        customersGrowth,
        recentOrders,
        topProducts,
        monthlyStats
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Impossible de charger les statistiques";
      logger.error("Error fetching analytics", { error: err, storeId });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [storeId, timeRange]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleExport = async () => {
    if (!analytics) return;
    
    try {
      // Générer un CSV avec les données réelles
      const csvContent = [
        ['Mois', 'Vues', 'Commandes', 'Revenus (FCFA)'],
        ...analytics.monthlyStats.map(stat => [
          stat.month,
          stat.views.toString(),
          stat.orders.toString(),
          stat.revenue.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-boutique-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès."
      });
    } catch (error) {
      logger.error("Error exporting analytics", { error });
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics de la boutique
              </CardTitle>
              <CardDescription>
                Suivez les performances de votre boutique
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="trends">Tendances</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Métriques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Vues totales</p>
                        <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <Badge variant="secondary" className="text-xs">
                        +{analytics.viewsGrowth}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Commandes</p>
                        <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {analytics.ordersGrowth !== 0 ? (
                        <>
                          {analytics.ordersGrowth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                          <Badge variant="secondary" className={`text-xs ${analytics.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analytics.ordersGrowth > 0 ? '+' : ''}{analytics.ordersGrowth.toFixed(1)}%
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          N/A
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenus</p>
                        <p className="text-2xl font-bold">{analytics.totalRevenue.toLocaleString()} FCFA</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {analytics.revenueGrowth !== 0 ? (
                        <>
                          {analytics.revenueGrowth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                          <Badge variant="secondary" className={`text-xs ${analytics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          N/A
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Clients</p>
                        <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {analytics.customersGrowth !== 0 ? (
                        <>
                          {analytics.customersGrowth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                          )}
                          <Badge variant="secondary" className={`text-xs ${analytics.customersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analytics.customersGrowth > 0 ? '+' : ''}{analytics.customersGrowth.toFixed(1)}%
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          N/A
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Commandes récentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Commandes récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentOrders.length > 0 ? (
                      analytics.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{order.total_amount.toLocaleString()} FCFA</p>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Aucune commande récente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.price.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {product.sales_count} ventes
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques des commandes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-500">{analytics.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Total commandes</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-500">
                        {analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(0) : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Panier moyen (FCFA)</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-500">{analytics.totalCustomers}</p>
                      <p className="text-sm text-muted-foreground">Clients uniques</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Évolution mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{stat.month}</p>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{stat.views}</p>
                            <p className="text-muted-foreground">Vues</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{stat.orders}</p>
                            <p className="text-muted-foreground">Commandes</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{stat.revenue.toLocaleString()}</p>
                            <p className="text-muted-foreground">FCFA</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreAnalytics;
