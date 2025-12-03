import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useProductsOptimized } from "@/hooks/useProductsOptimized";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, BarChart3, Plus } from "lucide-react";
import { SalesChart } from "@/components/analytics/SalesChart";
import { TopProducts } from "@/components/analytics/TopProducts";
import { RecentOrders } from "@/components/analytics/RecentOrders";
import { UnifiedAnalyticsDashboard } from "@/components/analytics/UnifiedAnalyticsDashboard";
import { FunnelAnalysis } from "@/components/analytics/FunnelAnalysis";
import { CohortAnalysis } from "@/components/analytics/CohortAnalysis";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { orders, loading: ordersLoading } = useOrders(store?.id);
  // Utiliser avec limite pour stats (pas besoin de tous les clients/produits)
  const { data: customersResult, isLoading: customersLoading } = useCustomers(store?.id, { page: 1, pageSize: 1000 });
  const customers = customersResult?.data || [];
  const { products, isLoading: productsLoading } = useProductsOptimized(store?.id, { page: 1, itemsPerPage: 1000 });

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const chartsRef = useScrollAnimation<HTMLDivElement>();

  // Calculs optimisés avec useMemo
  const totalRevenue = useMemo(() => 
    orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
    [orders]
  );
  const completedOrders = useMemo(() => 
    orders?.filter(o => o.status === 'completed').length || 0,
    [orders]
  );
  const activeProducts = useMemo(() => 
    products?.filter(p => p.is_active).length || 0,
    [products]
  );

  // Logging pour le chargement des données
  useEffect(() => {
    if (!ordersLoading && !customersLoading && !productsLoading && orders && customers && products) {
      logger.info(`Analytics chargées: ${orders.length} commandes, ${customers.length} clients, ${products.length} produits`);
    }
  }, [ordersLoading, customersLoading, productsLoading, orders, customers, products]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Skeleton className="h-8 w-64 mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-bold">Aucune boutique sélectionnée</CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-2">
                    Veuillez sélectionner une boutique ou créer une nouvelle boutique pour voir vos statistiques.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate("/dashboard/store")} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une boutique
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/dashboard")} 
                    >
                      Retour au tableau de bord
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isLoading = ordersLoading || customersLoading || productsLoading;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
              role="banner"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2" id="analytics-title">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Statistiques
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Vue d'ensemble de votre activité
                </p>
              </div>
            </div>

            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label="Cartes statistiques"
            >
              {/* Revenu total */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Revenu total</p>
                      {isLoading ? (
                        <Skeleton className="h-6 w-24 mb-1" />
                      ) : (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {totalRevenue.toLocaleString()} XOF
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">Total des ventes</p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commandes */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Commandes</p>
                      {isLoading ? (
                        <Skeleton className="h-6 w-16 mb-1" />
                      ) : (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {orders?.length || 0}
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">{completedOrders} terminées</p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clients */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Clients</p>
                      {isLoading ? (
                        <Skeleton className="h-6 w-16 mb-1" />
                      ) : (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {customers?.length || 0}
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">Base clients</p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Produits actifs */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Produits actifs</p>
                      {isLoading ? (
                        <Skeleton className="h-6 w-16 mb-1" />
                      ) : (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {activeProducts}
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">Sur {products?.length || 0} total</p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs pour basculer entre vue classique, vue unifiée et analytics avancés */}
            <Tabs defaultValue="unified" className="space-y-4">
              <TabsList>
                <TabsTrigger value="unified">Vue Unifiée</TabsTrigger>
                <TabsTrigger value="classic">Vue Classique</TabsTrigger>
                <TabsTrigger value="advanced">Analytics Avancés</TabsTrigger>
              </TabsList>

              <TabsContent value="unified" className="space-y-4">
                <UnifiedAnalyticsDashboard />
              </TabsContent>

              <TabsContent value="classic" className="space-y-4">
                {/* Charts and Tables */}
                <div
                  ref={chartsRef}
                  className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  role="region"
                  aria-label="Graphiques et tableaux"
                >
                  <SalesChart orders={orders || []} loading={isLoading} />
                  <TopProducts orders={orders || []} loading={isLoading} />
                </div>

                <div role="region" aria-label="Commandes récentes" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <RecentOrders orders={orders?.slice(0, 5) || []} loading={isLoading} />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                {/* Analytics Avancés */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <FunnelAnalysis />
                  <CohortAnalysis />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
