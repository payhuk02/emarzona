import { useMemo, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/hooks/use-store";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { SalesChart } from "@/components/analytics/SalesChart";
import { TopProducts } from "@/components/analytics/TopProducts";
import { RecentOrders } from "@/components/analytics/RecentOrders";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Analytics = () => {
  const { store, loading: storeLoading } = useStore();
  const { orders, loading: ordersLoading } = useOrders(store?.id);
  const { customers, loading: customersLoading } = useCustomers(store?.id);
  const { products, loading: productsLoading } = useProducts(store?.id);

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
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
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
          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Boutique non configurée</CardTitle>
                <CardDescription>
                  Veuillez d'abord créer votre boutique pour voir vos statistiques.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isLoading = ordersLoading || customersLoading || productsLoading;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8" role="main" aria-labelledby="analytics-title">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div ref={headerRef} role="banner">
              <h1 className="text-3xl font-bold tracking-tight" id="analytics-title">Statistiques</h1>
              <p className="text-muted-foreground mt-1">
                Vue d'ensemble de votre activité
              </p>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Cartes statistiques">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {totalRevenue.toLocaleString()} XOF
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total des ventes
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{orders?.length || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedOrders} terminées
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{customers?.length || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Base clients
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{activeProducts}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sur {products?.length || 0} total
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <div ref={chartsRef} className="grid gap-6 md:grid-cols-2" role="region" aria-label="Graphiques et tableaux">
              <SalesChart orders={orders || []} loading={isLoading} />
              <TopProducts orders={orders || []} loading={isLoading} />
            </div>

            <div role="region" aria-label="Commandes récentes">
              <RecentOrders orders={orders?.slice(0, 5) || []} loading={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
