import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Package, ShoppingCart, Users, DollarSign, Activity, Zap, Bell, Settings } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStatsRobust";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "@/styles/dashboard-responsive.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { stats, loading, error: hookError, refetch } = useDashboardStats();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [error, setError] = useState<string | null>(null);

  // Données simulées pour les notifications
  const notifications = useMemo(() => [
    {
      id: '1',
      title: t('dashboard.notifications.newOrder'),
      message: t('dashboard.notifications.newOrderMessage', { orderNumber: 'ORD-20250121-0001', amount: '25,000' }),
      type: 'success' as const,
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: t('dashboard.notifications.outOfStock'),
      message: t('dashboard.notifications.outOfStockMessage', { productName: 'Formation Expert' }),
      type: 'warning' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: '3',
      title: t('dashboard.notifications.paymentReceived'),
      message: t('dashboard.notifications.paymentReceivedMessage', { amount: '15,000' }),
      type: 'success' as const,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ], [t]);

  const handleRefresh = async () => {
    try {
      setError(null);
      await refetch();
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    }
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

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  if (storeLoading || loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">{t('dashboard.loading')}</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                <SidebarTrigger />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{t('dashboard.title')}</h1>
                </div>
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
              <div className="max-w-3xl mx-auto text-center py-12">
                <h2 className="text-2xl font-bold mb-4">{t('dashboard.welcome')}</h2>
                <p className="text-muted-foreground mb-6">
                  {t('dashboard.createStorePrompt')}
                </p>
                <Button onClick={() => navigate("/dashboard/store")} size="lg">
                  {t('dashboard.createStoreButton')}
                </Button>
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
        
        <div className="flex-1 flex flex-col">
          {/* Header - Responsive et Professionnel */}
          <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm shadow-soft">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">
                  {t('dashboard.titleWithStore', { storeName: store.name })}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-1 hidden sm:flex">
                  <Activity className="h-3 w-3 mr-1" />
                  {t('dashboard.online')}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="touch-manipulation min-h-[44px] min-w-[44px]"
                  aria-label={t('dashboard.refresh')}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
            {(error || hookError) && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-red-500 rounded-full"></div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">{t('dashboard.error.title')}</h3>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error || hookError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2 touch-manipulation min-h-[44px]"
                >
                  {t('dashboard.retry')}
                </Button>
              </div>
            )}
            <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
              
              {/* Stats Grid - Responsive et Professionnel */}
              <div className="dashboard-stats-grid">
                <Card className="dashboard-card group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 dashboard-card-header">
                    <CardTitle className="dashboard-card-title">{t('dashboard.stats.products.title')}</CardTitle>
                    <div className="dashboard-icon-container bg-green-500/10 group-hover:bg-green-500/20">
                      <Package className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="dashboard-card-content pt-0">
                    <div className="dashboard-stat-value">{stats.totalProducts}</div>
                    <p className="dashboard-stat-description">{t('dashboard.stats.products.active', { count: stats.activeProducts })}</p>
                    <Badge variant="default" className="text-xs px-2 py-1">
                      +{stats.trends.productGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="dashboard-card group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 dashboard-card-header">
                    <CardTitle className="dashboard-card-title">{t('dashboard.stats.orders.title')}</CardTitle>
                    <div className="dashboard-icon-container bg-blue-500/10 group-hover:bg-blue-500/20">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="dashboard-card-content pt-0">
                    <div className="dashboard-stat-value">{stats.totalOrders}</div>
                    <p className="dashboard-stat-description">{t('dashboard.stats.orders.pending', { count: stats.pendingOrders })}</p>
                    <Badge variant="default" className="text-xs px-2 py-1">
                      +{stats.trends.orderGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="dashboard-card group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 dashboard-card-header">
                    <CardTitle className="dashboard-card-title">{t('dashboard.stats.customers.title')}</CardTitle>
                    <div className="dashboard-icon-container bg-purple-500/10 group-hover:bg-purple-500/20">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="dashboard-card-content pt-0">
                    <div className="dashboard-stat-value">{stats.totalCustomers}</div>
                    <p className="dashboard-stat-description">{t('dashboard.stats.customers.registered')}</p>
                    <Badge variant="default" className="text-xs px-2 py-1">
                      +{stats.trends.customerGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="dashboard-card group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 dashboard-card-header">
                    <CardTitle className="dashboard-card-title">{t('dashboard.stats.revenue.title')}</CardTitle>
                    <div className="dashboard-icon-container bg-yellow-500/10 group-hover:bg-yellow-500/20">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="dashboard-card-content pt-0">
                    <div className="dashboard-stat-value">{stats.totalRevenue.toLocaleString()} FCFA</div>
                    <p className="dashboard-stat-description">{t('dashboard.stats.revenue.total')}</p>
                    <Badge variant="default" className="text-xs px-2 py-1">
                      +{stats.trends.revenueGrowth}%
                    </Badge>
                  </CardContent>
                </Card>
                </div>

                {/* Quick Actions - Responsive et Professionnel */}
              <Card className="shadow-soft hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    {t('dashboard.quickActions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="dashboard-actions-grid">
                    <Card className="cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 group touch-manipulation min-h-[120px] sm:min-h-[140px]">
                      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <Package className="h-6 w-6 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1">{t('dashboard.quickActions.newProduct')}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.quickActions.newProductDesc')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 group touch-manipulation min-h-[120px] sm:min-h-[140px]" onClick={handleCreateOrder}>
                      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <ShoppingCart className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1">{t('dashboard.quickActions.newOrder')}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.quickActions.newOrderDesc')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 group touch-manipulation min-h-[120px] sm:min-h-[140px]" onClick={handleViewAnalytics}>
                      <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <Activity className="h-6 w-6 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1">{t('dashboard.quickActions.analytics')}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.quickActions.analyticsDesc')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Row - Responsive et Professionnel */}
              <div className="dashboard-bottom-grid">
                <Card className="shadow-soft hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Bell className="h-5 w-5 text-blue-500" />
                      </div>
                      {t('dashboard.notifications.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="p-1.5 rounded-full bg-blue-500/10">
                              <Bell className="h-3 w-3 text-blue-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  {t('dashboard.notificationsBadge.new')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      {t('dashboard.recentActivity.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-3">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="p-1.5 rounded-full bg-green-500/10">
                              <Activity className="h-3 w-3 text-green-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium mb-1 line-clamp-2">{activity.message}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {activity.status && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <div className="p-2 rounded-lg bg-gray-500/10">
                        <Settings className="h-5 w-5 text-gray-500" />
                      </div>
                      Paramètres Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12 text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                        onClick={handleViewStore}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Paramètres Boutique
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12 text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                        onClick={handleManageCustomers}
                      >
                        <Users className="h-4 w-4 mr-3" />
                        Gérer les Clients
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12 text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                        onClick={handleSettings}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;