/**
 * Page Admin Suppliers Management - Gestion des fournisseurs
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Gestion des fournisseurs
 * - Gestion des commandes fournisseurs
 * - Règles de réapprovisionnement automatique
 */

import { useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SuppliersManagement,
  SupplierProducts,
  SupplierOrders,
  AutoReorderRules,
} from '@/components/physical/suppliers';
import {
  useSuppliers,
  useSupplierOrders,
  useAutoReorderRules,
} from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { Building2, Package, RefreshCw, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminSuppliersManagement() {
  const { store, loading: storeLoading } = useStore();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(store?.id);
  const { data: orders, isLoading: ordersLoading } = useSupplierOrders(store?.id);
  const { data: rules, isLoading: rulesLoading } = useAutoReorderRules(store?.id);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Calculer statistiques
  const stats = useMemo(() => {
    const totalSuppliers = suppliers?.length || 0;
    const activeSuppliers = suppliers?.filter(s => s.is_active).length || 0;
    const preferredSuppliers = suppliers?.filter(s => s.is_preferred).length || 0;
    const totalOrders = orders?.length || 0;
    const pendingOrders =
      orders?.filter(o => ['draft', 'pending', 'sent'].includes(o.status)).length || 0;
    const activeRules = rules?.filter(r => r.is_active).length || 0;

    return {
      totalSuppliers,
      activeSuppliers,
      preferredSuppliers,
      totalOrders,
      pendingOrders,
      activeRules,
    };
  }, [suppliers, orders, rules]);

  // Loading state
  if (storeLoading || suppliersLoading || ordersLoading || rulesLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col bg-background">
            <main className="flex-1 overflow-auto overflow-x-hidden pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 lg:w-80" />
                  <Skeleton className="h-4 sm:h-5 w-40 sm:w-48 lg:w-64" />
                </div>
                <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-20 sm:h-24 lg:h-28" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Empty state - No store
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col bg-background">
            <main className="flex-1 overflow-auto overflow-x-hidden pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-3 sm:px-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center mb-4 animate-in fade-in slide-in-from-bottom-4">
                    <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Aucune boutique trouvée
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-md mx-auto">
                    Vous devez créer une boutique pour gérer vos fournisseurs
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-background">
          <main className="flex-1 overflow-auto overflow-x-hidden pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Header */}
              <div
                ref={headerRef}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <SidebarTrigger className="mt-1 sm:mt-0 shrink-0 h-9 w-9 sm:h-10 sm:w-10" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                          <Building2
                            className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                          Gestion des Fournisseurs
                        </span>
                      </div>
                    </h1>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                      Gérez vos fournisseurs, commandes et réapprovisionnements automatiques
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div
                ref={statsRef}
                className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {[
                  {
                    label: 'Total',
                    value: stats.totalSuppliers,
                    icon: Building2,
                    color: 'from-purple-600 to-pink-600',
                    iconBg: 'from-purple-500/10 to-pink-500/5',
                    iconBorder: 'border-purple-500/20',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    label: 'Actifs',
                    value: stats.activeSuppliers,
                    icon: CheckCircle2,
                    color: 'from-green-600 to-emerald-600',
                    iconBg: 'from-green-500/10 to-emerald-500/5',
                    iconBorder: 'border-green-500/20',
                    iconColor: 'text-green-600 dark:text-green-400',
                  },
                  {
                    label: 'Préférés',
                    value: stats.preferredSuppliers,
                    icon: Building2,
                    color: 'from-yellow-600 to-orange-600',
                    iconBg: 'from-yellow-500/10 to-orange-500/5',
                    iconBorder: 'border-yellow-500/20',
                    iconColor: 'text-yellow-600 dark:text-yellow-400',
                  },
                  {
                    label: 'Commandes',
                    value: stats.totalOrders,
                    icon: Package,
                    color: 'from-blue-600 to-cyan-600',
                    iconBg: 'from-blue-500/10 to-cyan-500/5',
                    iconBorder: 'border-blue-500/20',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'En attente',
                    value: stats.pendingOrders,
                    icon: RefreshCw,
                    color: 'from-yellow-600 to-orange-600',
                    iconBg: 'from-yellow-500/10 to-orange-500/5',
                    iconBorder: 'border-yellow-500/20',
                    iconColor: 'text-yellow-600 dark:text-yellow-400',
                  },
                  {
                    label: 'Règles actives',
                    value: stats.activeRules,
                    icon: RefreshCw,
                    color: 'from-green-600 to-emerald-600',
                    iconBg: 'from-green-500/10 to-emerald-500/5',
                    iconBorder: 'border-green-500/20',
                    iconColor: 'text-green-600 dark:text-green-400',
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                        <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                          <div
                            className={`p-1 sm:p-1.5 rounded-lg bg-gradient-to-br ${stat.iconBg} border ${stat.iconBorder} flex items-center justify-center`}
                          >
                            <Icon
                              className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 ${stat.iconColor}`}
                            />
                          </div>
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                        <div
                          className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}
                        >
                          {stat.value}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Tabs */}
              <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Tabs defaultValue="suppliers" className="w-full">
                  <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-2 lg:grid-cols-4 sm:flex overflow-x-auto">
                    <TabsTrigger
                      value="suppliers"
                      className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation"
                    >
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Fournisseurs</span>
                      <span className="sm:hidden">Fournis.</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="products"
                      className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Produits</span>
                      <span className="sm:hidden">Prod.</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="orders"
                      className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation"
                    >
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Commandes</span>
                      <span className="sm:hidden">Cmd.</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="reorder-rules"
                      className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation"
                    >
                      <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Réapprovisionnement</span>
                      <span className="sm:hidden">Réappro.</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="suppliers"
                    className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <SuppliersManagement />
                  </TabsContent>

                  <TabsContent
                    value="products"
                    className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <SupplierProducts />
                  </TabsContent>

                  <TabsContent
                    value="orders"
                    className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <SupplierOrders />
                  </TabsContent>

                  <TabsContent
                    value="reorder-rules"
                    className="mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <AutoReorderRules />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
