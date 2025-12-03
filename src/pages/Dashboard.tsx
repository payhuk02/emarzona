import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Package, ShoppingCart, Users, DollarSign, Activity, Zap, Bell, Settings, LayoutDashboard, AlertCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { usePageCustomization } from "@/hooks/usePageCustomization";
import "@/styles/dashboard-responsive.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const { getValue } = usePageCustomization('dashboard');
  const { store, loading: storeLoading } = useStore();
  const { stats, loading, error: hookError, refetch } = useDashboardStats();
  const navigate = useNavigate();
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

  const handleRefresh = useCallback(async () => {
    try {
      setError(null);
      logger.info('Actualisation du dashboard...', {});
      await refetch();
      logger.info('Dashboard actualisé avec succès', {});
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      const error = err instanceof Error ? err : new Error('Erreur lors de l\'actualisation du dashboard');
      logger.error(error, {
        error: err,
        message: errorMessage,
      });
      setError(errorMessage || 'Erreur lors du chargement des données');
    }
  }, [refetch]);

  const handleCreateProduct = useCallback(() => {
    navigate('/dashboard/products/new');
  }, [navigate]);

  const handleCreateOrder = useCallback(() => {
    navigate('/dashboard/orders');
  }, [navigate]);

  const handleViewAnalytics = useCallback(() => {
    navigate('/dashboard/analytics');
  }, [navigate]);

  const handleManageCustomers = useCallback(() => {
    navigate('/dashboard/customers');
  }, [navigate]);

  const handleViewStore = useCallback(() => {
    navigate('/dashboard/store');
  }, [navigate]);

  const handleSettings = useCallback(() => {
    navigate('/dashboard/settings');
  }, [navigate]);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const bottomRef = useScrollAnimation<HTMLDivElement>();

  // Loading state
  if (storeLoading || loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
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

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                  <LayoutDashboard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {getValue('dashboard.welcome')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                    {t('dashboard.createStorePrompt')}
                  </p>
                  <Button 
                    onClick={() => navigate("/dashboard/store")} 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-h-[44px] text-sm sm:text-base"
                  >
                    {getValue('dashboard.createStoreButton')}
                  </Button>
                </CardContent>
              </Card>
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
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                        <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        {getValue('dashboard.title') || t('dashboard.title')}
                      </span>
                    </div>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    Vue d'ensemble de votre boutique
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:flex items-center gap-1.5 min-h-[44px]" aria-label={getValue('dashboard.online') || 'En ligne'}>
                  <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  {getValue('dashboard.online')}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="min-h-[44px] min-w-[44px] p-0"
                  aria-label={getValue('dashboard.refresh')}
                  title={getValue('dashboard.refresh')}
                >
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Error Alert */}
            {(error || hookError) && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4 duration-500">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm sm:text-base">{t('dashboard.error.title')}</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm mt-1">
                  {error || hookError}
                </AlertDescription>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="min-h-[44px] text-xs sm:text-sm"
                    aria-label={t('dashboard.retry')}
                  >
                    {t('dashboard.retry')}
                  </Button>
                </div>
              </Alert>
            )}
            {/* Stats Cards - Responsive & Animated */}
            {stats && (
              <div
                ref={statsRef}
                className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                role="region"
                aria-label={t('dashboard.stats.ariaLabel', 'Statistiques du tableau de bord')}
              >
                {[
                  {
                    label: t('dashboard.stats.products.title'),
                    value: stats.totalProducts ?? 0,
                    description: t('dashboard.stats.products.active', { count: stats.activeProducts }),
                    icon: Package,
                    color: 'from-green-600 to-emerald-600',
                    trend: `+${stats.trends.productGrowth}%`,
                  },
                  {
                    label: t('dashboard.stats.orders.title'),
                    value: stats.totalOrders,
                    description: t('dashboard.stats.orders.pending', { count: stats.pendingOrders }),
                    icon: ShoppingCart,
                    color: 'from-blue-600 to-cyan-600',
                    trend: `+${stats.trends.orderGrowth}%`,
                  },
                  {
                    label: t('dashboard.stats.customers.title'),
                    value: stats.totalCustomers,
                    description: t('dashboard.stats.customers.registered'),
                    icon: Users,
                    color: 'from-purple-600 to-pink-600',
                    trend: `+${stats.trends.customerGrowth}%`,
                  },
                  {
                    label: t('dashboard.stats.revenue.title'),
                    value: `${stats.totalRevenue.toLocaleString()} FCFA`,
                    description: t('dashboard.stats.revenue.total'),
                    icon: DollarSign,
                    color: 'from-yellow-600 to-orange-600',
                    trend: `+${stats.trends.revenueGrowth}%`,
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 break-words`}>
                          {stat.value}
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 leading-tight">
                          {stat.description}
                        </p>
                        <Badge variant="default" className="text-[10px] sm:text-xs px-2 py-0.5">
                          {stat.trend}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Actions - Responsive & Animated */}
            <Card 
              ref={actionsRef} 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700" 
              role="region" 
              aria-labelledby="quick-actions-title"
            >
              <CardHeader className="pb-3 p-4 sm:p-6">
                <CardTitle id="quick-actions-title" className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  {t('dashboard.quickActions.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides disponibles')}>
                  {[
                    {
                      title: t('dashboard.quickActions.newProduct'),
                      description: t('dashboard.quickActions.newProductDesc'),
                      icon: Package,
                      color: 'from-green-600 to-emerald-600',
                      onClick: handleCreateProduct,
                    },
                    {
                      title: t('dashboard.quickActions.newOrder'),
                      description: t('dashboard.quickActions.newOrderDesc'),
                      icon: ShoppingCart,
                      color: 'from-blue-600 to-cyan-600',
                      onClick: handleCreateOrder,
                    },
                    {
                      title: t('dashboard.quickActions.analytics'),
                      description: t('dashboard.quickActions.analyticsDesc'),
                      icon: Activity,
                      color: 'from-purple-600 to-pink-600',
                      onClick: handleViewAnalytics,
                    },
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Card
                        key={action.title}
                        className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group touch-manipulation min-h-[100px] sm:min-h-[120px] md:min-h-[140px] animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={action.onClick}
                        role="listitem"
                        aria-label={action.title}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            action.onClick();
                          }
                        }}
                      >
                        <CardContent className="p-3 sm:p-4 md:p-6 h-full flex flex-col justify-center">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${action.color === 'from-green-600 to-emerald-600' ? 'from-green-500/10 to-emerald-500/10' : action.color === 'from-blue-600 to-cyan-600' ? 'from-blue-500/10 to-cyan-500/10' : 'from-purple-500/10 to-pink-500/10'} group-hover:opacity-80 transition-colors shrink-0`}>
                              <Icon 
                                className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color === 'from-green-600 to-emerald-600' ? 'text-green-500' : action.color === 'from-blue-600 to-cyan-600' ? 'text-blue-500' : 'text-purple-500'}`} 
                                aria-hidden="true" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base mb-1 break-words">{action.title}</h3>
                              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row - Responsive & Animated */}
            <div 
              ref={bottomRef} 
              className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700" 
              role="region" 
              aria-label={t('dashboard.bottomSection.ariaLabel', 'Notifications et activité récente')}
            >
              {/* Notifications */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300" role="region" aria-labelledby="notifications-title">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <CardTitle id="notifications-title" className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    {t('dashboard.notifications.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3" role="list" aria-label={t('dashboard.notifications.list.ariaLabel', 'Liste des notifications')}>
                    {notifications.length === 0 ? (
                      <div className="text-center py-6">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="flex items-start gap-3 p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[60px] cursor-pointer" 
                          role="listitem"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="p-1.5 sm:p-2 rounded-full bg-blue-500/10">
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" aria-hidden="true" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium mb-1">{notification.title}</h4>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <div className="flex items-center gap-2 flex-wrap">
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
                    </div>
                    {t('dashboard.recentActivity.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {stats.recentActivity.length === 0 ? (
                      <div className="text-center py-6">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Aucune activité récente</p>
                      </div>
                    ) : (
                      stats.recentActivity.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex items-start gap-3 p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[60px] cursor-pointer"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="p-1.5 sm:p-2 rounded-full bg-green-500/10">
                              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium mb-1 line-clamp-2 leading-relaxed">{activity.message}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Settings */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-500/5 backdrop-blur-sm border border-gray-500/20">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    Paramètres Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 sm:h-12 text-xs sm:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                      onClick={handleViewStore}
                    >
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Paramètres Boutique
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 sm:h-12 text-xs sm:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                      onClick={handleManageCustomers}
                    >
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Gérer les Clients
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-10 sm:h-12 text-xs sm:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors" 
                      onClick={handleSettings}
                    >
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                      Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;