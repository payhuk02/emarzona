import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock, Activity, Zap } from "lucide-react";
import { useAdvancedDashboardStats } from "@/hooks/useAdvancedDashboardStats";
import { useStore } from "@/hooks/use-store";
import { AdvancedStatsCard, RevenueChart, OrdersChart, ActivityFeed, PerformanceMetrics } from "@/components/dashboard/AdvancedDashboardComponents";
import { QuickActions, NotificationCard, GoalProgress, RecentActivity, DashboardControls } from "@/components/dashboard/InteractiveWidgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const Dashboard = () => {
  const { store, loading: storeLoading } = useStore();
  const { stats, loading, refetch } = useAdvancedDashboardStats();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  // Données simulées pour les notifications
  const notifications = useMemo(() => [
    {
      id: '1',
      title: 'Nouvelle commande',
      message: 'Commande #ORD-20250121-0001 reçue pour 25,000 FCFA',
      type: 'success' as const,
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'Produit en rupture',
      message: 'Le produit "Formation Expert" est en rupture de stock',
      type: 'warning' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: 'Paiement reçu',
      message: 'Paiement de 15,000 FCFA confirmé',
      type: 'success' as const,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ], []);

  // Objectifs simulés
  const goals = useMemo(() => [
    {
      id: '1',
      title: 'Revenus mensuels',
      target: 500000,
      current: stats.totalRevenue,
      unit: 'FCFA',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      color: 'primary'
    },
    {
      id: '2',
      title: 'Nouveaux clients',
      target: 50,
      current: stats.totalCustomers,
      unit: 'clients',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      color: 'green'
    },
    {
      id: '3',
      title: 'Produits vendus',
      target: 100,
      current: stats.totalOrders,
      unit: 'commandes',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      color: 'blue'
    }
  ], [stats.totalRevenue, stats.totalCustomers, stats.totalOrders]);

  const handleRefresh = async () => {
    await refetch();
    setLastUpdated(new Date().toISOString());
  };

  const handleExport = () => {
    console.log('Exporting dashboard data...');
  };

  const handleFilter = () => {
    console.log('Opening filter options...');
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  const handleCreateProduct = () => {
    navigate('/dashboard/products/new');
  };

  const handleCreateOrder = () => {
    navigate('/dashboard/orders');
  };

  const handleViewAnalytics = () => {
    navigate('/dashboard/analytics');
  };

  const handleManageCustomers = () => {
    navigate('/dashboard/customers');
  };

  const handleViewStore = () => {
    navigate('/dashboard/store');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    console.log('Marking notification as read:', id);
  };

  const handleViewAllNotifications = () => {
    console.log('Viewing all notifications');
  };

  const handleViewAllActivity = () => {
    console.log('Viewing all activity');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Tableau de bord</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
            {storeLoading || loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Chargement du tableau de bord...</p>
                </div>
              </div>
            ) : !store ? (
              <div className="max-w-3xl mx-auto text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Bienvenue ! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Commencez par créer votre boutique pour accéder au tableau de bord avancé
                </p>
                <Button onClick={() => navigate("/dashboard/store")} size="lg">
                  Créer ma boutique
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
                
                {/* Controls */}
                <DashboardControls
                  onRefresh={handleRefresh}
                  onExport={handleExport}
                  onFilter={handleFilter}
                  onSettings={handleSettings}
                  lastUpdated={lastUpdated}
                />

                {/* Stats Grid */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <AdvancedStatsCard
                    title="Produits"
                    value={stats.totalProducts}
                    description={`${stats.activeProducts} actif${stats.activeProducts > 1 ? "s" : ""}`}
                    icon={Package}
                    color="green"
                    trend={{
                      value: stats.trends.productGrowth,
                      label: "vs mois dernier",
                      period: "30j"
                    }}
                  />
                  <AdvancedStatsCard
                    title="Commandes"
                    value={stats.totalOrders}
                    description={`${stats.pendingOrders} en attente`}
                    icon={ShoppingCart}
                    color="blue"
                    trend={{
                      value: stats.trends.orderGrowth,
                      label: "vs mois dernier",
                      period: "30j"
                    }}
                  />
                  <AdvancedStatsCard
                    title="Clients"
                    value={stats.totalCustomers}
                    description="Clients enregistrés"
                    icon={Users}
                    color="purple"
                    trend={{
                      value: stats.trends.customerGrowth,
                      label: "vs mois dernier",
                      period: "30j"
                    }}
                  />
                  <AdvancedStatsCard
                    title="Revenus"
                    value={`${stats.totalRevenue.toLocaleString()} FCFA`}
                    description="Total des ventes"
                    icon={DollarSign}
                    color="yellow"
                    trend={{
                      value: stats.trends.revenueGrowth,
                      label: "vs mois dernier",
                      period: "30j"
                    }}
                  />
                </div>

                {/* Quick Actions */}
                <QuickActions
                  onCreateProduct={handleCreateProduct}
                  onCreateOrder={handleCreateOrder}
                  onViewAnalytics={handleViewAnalytics}
                  onManageCustomers={handleManageCustomers}
                  onViewStore={handleViewStore}
                  onSettings={handleSettings}
                />

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <RevenueChart data={stats.revenueByMonth} />
                  <OrdersChart data={stats.ordersByStatus} />
                </div>

                {/* Performance Metrics */}
                <PerformanceMetrics metrics={stats.performanceMetrics} />

                {/* Bottom Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <NotificationCard
                      notifications={notifications}
                      onMarkAsRead={handleMarkNotificationAsRead}
                      onViewAll={handleViewAllNotifications}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <GoalProgress goals={goals} />
                  </div>
                  <div className="lg:col-span-1">
                    <RecentActivity
                      activities={stats.recentActivity}
                      onViewAll={handleViewAllActivity}
                    />
                  </div>
                </div>

                {/* Activity Feed */}
                <ActivityFeed activities={stats.recentActivity} />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
