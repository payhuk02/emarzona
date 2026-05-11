/**
 * Page d'Analytics Inventaire
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour :
 * - Rotation des stocks (turnover)
 * - Analyse ABC (produits fast/slow moving)
 * - Coûts d'inventaire
 * - Efficacité des méthodes de rotation
 * - Rapports exportables
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  RefreshCw,
  Download,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import { exportInventoryAnalyticsToCSV } from '@/lib/inventory-export';

interface InventoryAnalytics {
  product_id: string;
  product_name: string;
  product_image_url?: string;
  current_stock: number;
  total_sold: number;
  total_revenue: number;
  average_cost: number;
  turnover_rate: number;
  days_in_stock: number;
  abc_category: 'A' | 'B' | 'C';
  movement_type: 'fast' | 'medium' | 'slow' | 'dead';
}

export default function InventoryAnalytics() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();

  // State
  const [selectedTab, setSelectedTab] = useState<'turnover' | 'abc' | 'costs' | 'rotation'>('turnover');
  const [periodFilter, setPeriodFilter] = useState<'30' | '60' | '90' | '180' | '365'>('90');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Fetch inventory analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['inventory-analytics', store?.id, periodFilter],
    queryFn: async (): Promise<InventoryAnalytics[]> => {
      if (!store?.id) return [];

      const days = parseInt(periodFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les produits physiques avec leurs statistiques
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          product_type
        `)
        .eq('store_id', store.id)
        .eq('product_type', 'physical')
        .eq('is_active', true);

      if (productsError) {
        logger.error('Error fetching products', { error: productsError });
        return [];
      }

      // Pour chaque produit, calculer les statistiques
      const  analyticsData: InventoryAnalytics[] = [];

      for (const product of products || []) {
        // Récupérer le stock actuel
        const { data: inventory } = await supabase
          .from('inventory')
          .select('current_quantity, unit_cost')
          .eq('product_id', product.id)
          .eq('store_id', store.id)
          .single();

        const currentStock = inventory?.current_quantity || 0;
        const averageCost = inventory?.unit_cost || 0;

        // Récupérer les ventes dans la période
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('quantity, unit_price, created_at')
          .eq('product_id', product.id)
          .gte('created_at', startDate.toISOString())
          .in('order_id', 
            supabase
              .from('orders')
              .select('id')
              .eq('store_id', store.id)
              .eq('status', 'completed')
              .then(({ data }) => data?.map(o => o.id) || [])
          );

        const totalSold = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const totalRevenue = orderItems?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0;

        // Calculer le taux de rotation
        const turnoverRate = currentStock > 0 ? (totalSold / currentStock) : 0;

        // Calculer les jours en stock (approximation)
        const daysInStock = totalSold > 0 ? Math.floor((currentStock / totalSold) * days) : days;

        // Classification ABC (basée sur le revenu)
        const  abcCategory: 'A' | 'B' | 'C' = 'C';
        // Sera calculé après avoir tous les produits

        // Type de mouvement
        let  movementType: 'fast' | 'medium' | 'slow' | 'dead' = 'dead';
        if (turnoverRate > 0.5) {
          movementType = 'fast';
        } else if (turnoverRate > 0.2) {
          movementType = 'medium';
        } else if (turnoverRate > 0) {
          movementType = 'slow';
        }

        analyticsData.push({
          product_id: product.id,
          product_name: product.name || 'Produit',
          product_image_url: product.image_url,
          current_stock: currentStock,
          total_sold: totalSold,
          total_revenue: totalRevenue,
          average_cost: averageCost,
          turnover_rate: turnoverRate,
          days_in_stock: daysInStock,
          abc_category: abcCategory,
          movement_type: movementType,
        });
      }

      // Calculer la classification ABC
      const sortedByRevenue = [...analyticsData].sort((a, b) => b.total_revenue - a.total_revenue);
      const totalRevenue = sortedByRevenue.reduce((sum, p) => sum + p.total_revenue, 0);
      
      let  cumulativeRevenue= 0;
      sortedByRevenue.forEach((product, index) => {
        cumulativeRevenue += product.total_revenue;
        const percentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
        
        if (percentage <= 80) {
          product.abc_category = 'A';
        } else if (percentage <= 95) {
          product.abc_category = 'B';
        } else {
          product.abc_category = 'C';
        }
      });

      return analyticsData;
    },
    enabled: !!store?.id,
  });

  // Filtered analytics
  const filteredAnalytics = useMemo(() => {
    let  filtered= analytics;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.abc_category === categoryFilter);
    }

    if (movementFilter !== 'all') {
      filtered = filtered.filter((a) => a.movement_type === movementFilter);
    }

    return filtered;
  }, [analytics, categoryFilter, movementFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalValue = analytics.reduce((sum, a) => sum + (a.current_stock * a.average_cost), 0);
    const totalRevenue = analytics.reduce((sum, a) => sum + a.total_revenue, 0);
    const avgTurnover = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.turnover_rate, 0) / analytics.length
      : 0;
    const fastMoving = analytics.filter((a) => a.movement_type === 'fast').length;
    const slowMoving = analytics.filter((a) => a.movement_type === 'slow').length;
    const deadStock = analytics.filter((a) => a.movement_type === 'dead').length;
    const categoryA = analytics.filter((a) => a.abc_category === 'A').length;
    const categoryB = analytics.filter((a) => a.abc_category === 'B').length;
    const categoryC = analytics.filter((a) => a.abc_category === 'C').length;

    return {
      totalProducts: analytics.length,
      totalValue,
      totalRevenue,
      avgTurnover,
      fastMoving,
      slowMoving,
      deadStock,
      categoryA,
      categoryB,
      categoryC,
    };
  }, [analytics]);

  // Get ABC badge
  const getABCBadge = (category: string) => {
    const  config: Record<string, { label: string; className: string }> = {
      A: { label: 'A (80%)', className: 'bg-green-600 text-white' },
      B: { label: 'B (15%)', className: 'bg-yellow-600 text-white' },
      C: { label: 'C (5%)', className: 'bg-gray-600 text-white' },
    };

    const cfg = config[category] || { label: category, className: '' };

    return (
      <Badge className={cn(cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  // Get movement badge
  const getMovementBadge = (movement: string) => {
    const  config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      fast: { label: 'Rapide', variant: 'default', className: 'bg-green-600 text-white' },
      medium: { label: 'Moyen', variant: 'secondary', className: 'bg-yellow-600 text-white' },
      slow: { label: 'Lent', variant: 'secondary', className: 'bg-orange-600 text-white' },
      dead: { label: 'Mort', variant: 'destructive', className: 'bg-red-600 text-white' },
    };

    const cfg = config[movement] || { label: movement, variant: 'secondary' as const, className: '' };

    return (
      <Badge variant={cfg.variant} className={cn(cfg.className)}>
        {cfg.label}
      </Badge>
    );
  };

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || analyticsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/5 backdrop-blur-sm border border-indigo-500/20">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Analytics Inventaire
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Analysez la rotation, les coûts et la performance de votre inventaire
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    exportInventoryAnalyticsToCSV(filteredAnalytics);
                    toast({
                      title: '✅ Export réussi',
                      description: `${filteredAnalytics.length} produit(s) exporté(s) en CSV`,
                    });
                  } catch ( _error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    toast({
                      title: '❌ Erreur',
                      description: errorMessage || 'Impossible d\'exporter les données',
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={filteredAnalytics.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Produits</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Valeur Totale</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {stats.totalValue.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Rotation Moy.</CardTitle>
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {stats.avgTurnover.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Rapide</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.fastMoving}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Lent</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.slowMoving}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Stock Mort</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.deadStock}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Catégorie A</CardTitle>
                  <Badge className="bg-green-600 text-white">A</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.categoryA}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Catégorie B</CardTitle>
                  <Badge className="bg-yellow-600 text-white">B</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.categoryB}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 derniers jours</SelectItem>
                      <SelectItem value="60">60 derniers jours</SelectItem>
                      <SelectItem value="90">90 derniers jours</SelectItem>
                      <SelectItem value="180">180 derniers jours</SelectItem>
                      <SelectItem value="365">365 derniers jours</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="A">Catégorie A</SelectItem>
                      <SelectItem value="B">Catégorie B</SelectItem>
                      <SelectItem value="C">Catégorie C</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={movementFilter} onValueChange={setMovementFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les mouvements</SelectItem>
                      <SelectItem value="fast">Rapide</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="slow">Lent</SelectItem>
                      <SelectItem value="dead">Mort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
              <TabsList>
                <TabsTrigger value="turnover">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rotation ({filteredAnalytics.length})
                </TabsTrigger>
                <TabsTrigger value="abc">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyse ABC
                </TabsTrigger>
                <TabsTrigger value="costs">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Coûts
                </TabsTrigger>
                <TabsTrigger value="rotation">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Méthodes Rotation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="turnover" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rotation des Stocks</CardTitle>
                    <CardDescription>
                      Analysez la vitesse de rotation de vos produits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredAnalytics.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune donnée disponible</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Stock actuel</TableHead>
                              <TableHead>Ventes ({periodFilter}j)</TableHead>
                              <TableHead>Taux rotation</TableHead>
                              <TableHead>Jours en stock</TableHead>
                              <TableHead>Mouvement</TableHead>
                              <TableHead>Revenus</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAnalytics
                              .sort((a, b) => b.turnover_rate - a.turnover_rate)
                              .map((item) => (
                                <TableRow key={item.product_id}>
                                  <TableCell className="font-medium">{item.product_name}</TableCell>
                                  <TableCell>{item.current_stock}</TableCell>
                                  <TableCell>{item.total_sold}</TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      item.turnover_rate > 0.5 && 'text-green-600 font-semibold',
                                      item.turnover_rate > 0.2 && item.turnover_rate <= 0.5 && 'text-yellow-600 font-semibold',
                                      item.turnover_rate > 0 && item.turnover_rate <= 0.2 && 'text-orange-600 font-semibold',
                                      item.turnover_rate === 0 && 'text-red-600 font-semibold'
                                    )}>
                                      {item.turnover_rate.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell>{item.days_in_stock}j</TableCell>
                                  <TableCell>{getMovementBadge(item.movement_type)}</TableCell>
                                  <TableCell>
                                    {item.total_revenue.toLocaleString('fr-FR')} XOF
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="abc" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse ABC</CardTitle>
                    <CardDescription>
                      Classification des produits par importance (A: 80% revenus, B: 15%, C: 5%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredAnalytics.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune donnée disponible</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Catégorie</TableHead>
                              <TableHead>Revenus</TableHead>
                              <TableHead>% du total</TableHead>
                              <TableHead>Ventes</TableHead>
                              <TableHead>Stock</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAnalytics
                              .sort((a, b) => {
                                const order = { A: 1, B: 2, C: 3 };
                                return (order[a.abc_category] || 3) - (order[b.abc_category] || 3);
                              })
                              .map((item) => {
                                const totalRevenue = analytics.reduce((sum, a) => sum + a.total_revenue, 0);
                                const percentage = totalRevenue > 0 ? (item.total_revenue / totalRevenue) * 100 : 0;
                                
                                return (
                                  <TableRow key={item.product_id}>
                                    <TableCell className="font-medium">{item.product_name}</TableCell>
                                    <TableCell>{getABCBadge(item.abc_category)}</TableCell>
                                    <TableCell className="font-semibold">
                                      {item.total_revenue.toLocaleString('fr-FR')} XOF
                                    </TableCell>
                                    <TableCell>{percentage.toFixed(1)}%</TableCell>
                                    <TableCell>{item.total_sold}</TableCell>
                                    <TableCell>{item.current_stock}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Coûts d'Inventaire</CardTitle>
                    <CardDescription>
                      Analysez la valeur et les coûts de votre inventaire
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredAnalytics.length === 0 ? (
                      <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune donnée disponible</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Coût unitaire</TableHead>
                              <TableHead>Valeur stock</TableHead>
                              <TableHead>Revenus</TableHead>
                              <TableHead>Marge</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAnalytics
                              .sort((a, b) => (b.current_stock * b.average_cost) - (a.current_stock * a.average_cost))
                              .map((item) => {
                                const stockValue = item.current_stock * item.average_cost;
                                const margin = item.total_revenue - (item.total_sold * item.average_cost);
                                const marginPercent = item.total_revenue > 0
                                  ? ((margin / item.total_revenue) * 100)
                                  : 0;
                                
                                return (
                                  <TableRow key={item.product_id}>
                                    <TableCell className="font-medium">{item.product_name}</TableCell>
                                    <TableCell>{item.current_stock}</TableCell>
                                    <TableCell>
                                      {item.average_cost.toLocaleString('fr-FR')} XOF
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {stockValue.toLocaleString('fr-FR')} XOF
                                    </TableCell>
                                    <TableCell>
                                      {item.total_revenue.toLocaleString('fr-FR')} XOF
                                    </TableCell>
                                    <TableCell>
                                      <span className={cn(
                                        marginPercent > 30 && 'text-green-600 font-semibold',
                                        marginPercent > 10 && marginPercent <= 30 && 'text-yellow-600 font-semibold',
                                        marginPercent <= 10 && 'text-red-600 font-semibold'
                                      )}>
                                        {margin.toLocaleString('fr-FR')} XOF ({marginPercent.toFixed(1)}%)
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rotation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Méthodes de Rotation</CardTitle>
                    <CardDescription>
                      Analysez l'efficacité des méthodes de rotation (FIFO, LIFO, FEFO)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        L'analyse des méthodes de rotation sera disponible prochainement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







