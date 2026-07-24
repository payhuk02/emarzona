import { useState, useEffect } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';
import { useOrders } from '@/hooks/useOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingCart, Users, Package, BarChart3, Plus } from 'lucide-react';
import { SalesChart } from '@/components/analytics/SalesChart';
import { TopProducts } from '@/components/analytics/TopProducts';
import { RecentOrders } from '@/components/analytics/RecentOrders';
import { UnifiedAnalyticsDashboard } from '@/components/analytics/UnifiedAnalyticsDashboard';
import { STORE_CREATE_PATH } from '@/lib/store/store-create-path';
import { FunnelAnalysis } from '@/components/analytics/FunnelAnalysis';
import { CohortAnalysis } from '@/components/analytics/CohortAnalysis';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnifiedAnalytics, type TimeRange } from '@/hooks/useUnifiedAnalytics';

const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;

const Analytics = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useUnifiedAnalytics(timeRange);
  // Liste paginée uniquement pour graphiques / commandes récentes (vue classique)
  const { orders, loading: ordersLoading } = useOrders(store?.id, {
    page: 0,
    pageSize: 50,
    sortBy: 'created_at',
    sortDirection: 'desc',
  });

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const chartsRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    if (!analyticsLoading && store?.id) {
      logger.info('Analytics page overview synced', {
        storeId: store.id,
        timeRange,
        revenue: analytics.overview.totalRevenue,
        orders: analytics.overview.totalOrders,
        buyers: analytics.overview.totalCustomers,
        crm: analytics.overview.crmCustomersTotal,
      });
    }
  }, [analyticsLoading, store?.id, timeRange, analytics.overview]);

  if (storeLoading) {
    return (
      <AppPageShell>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppPageShell>
    );
  }

  if (!store) {
    return (
      <AppPageShell>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                Aucune boutique sélectionnée
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                Veuillez sélectionner une boutique ou créer une nouvelle boutique pour voir vos
                statistiques.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate(STORE_CREATE_PATH)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une boutique
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppPageShell>
    );
  }

  const isLoading = analyticsLoading;
  const overview = analytics.overview;

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
          role="banner"
        >
          <div>
            <h1
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
              id="analytics-title"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BarChart3
                  className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary"
                  aria-hidden="true"
                />
              </div>
              <span className="text-foreground">Statistiques</span>
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Vue d&apos;ensemble de votre activité
            </p>
          </div>
          <Select value={timeRange} onValueChange={v => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-full sm:w-[10.5rem]" aria-label="Période d'analyse">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analyticsError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-3 text-sm text-destructive">
              Impossible de charger certaines métriques : {analyticsError}
            </CardContent>
          </Card>
        )}

        {/* Cartes synchronisées avec Vue Unifiée (même période + mêmes règles) */}
        <div
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="region"
          aria-label="Cartes statistiques"
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenu (période)</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mb-1" />
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {formatFcfa(overview.totalRevenue)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Commandes payées éligibles
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Commandes</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mb-1" />
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {overview.totalOrders}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Sur la période sélectionnée
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acheteurs</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mb-1" />
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {overview.totalCustomers}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Base CRM : {overview.crmCustomersTotal}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Produits actifs</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mb-1" />
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-foreground">
                      {overview.activeProducts}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Sur {overview.totalProducts} total
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unified" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unified">Vue Unifiée</TabsTrigger>
            <TabsTrigger value="classic">Vue Classique</TabsTrigger>
            <TabsTrigger value="advanced">Analytics Avancés</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="space-y-4">
            <UnifiedAnalyticsDashboard
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              analytics={analytics}
              loading={analyticsLoading}
              hidePeriodSelect
            />
          </TabsContent>

          <TabsContent value="classic" className="space-y-4">
            <div
              ref={chartsRef}
              className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label="Graphiques et tableaux"
            >
              <SalesChart orders={orders || []} loading={ordersLoading} />
              <TopProducts products={analytics.topProducts} loading={analyticsLoading} />
            </div>

            <div
              role="region"
              aria-label="Commandes récentes"
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <RecentOrders orders={orders?.slice(0, 5) || []} loading={ordersLoading} />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <FunnelAnalysis storeId={store.id} timeRange={timeRange} />
              <CohortAnalysis />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppPageShell>
  );
};

export default Analytics;
