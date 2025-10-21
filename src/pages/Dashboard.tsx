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

const Dashboard = () => {
  const { store, loading: storeLoading } = useStore();
  const { stats, loading, error: hookError, refetch } = useDashboardStats();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [error, setError] = useState<string | null>(null);

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
              <p className="mt-2 text-muted-foreground">Chargement du tableau de bord...</p>
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
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Tableau de bord</h1>
                </div>
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
              <div className="max-w-3xl mx-auto text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Bienvenue ! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Commencez par créer votre boutique pour accéder au tableau de bord avancé
                </p>
                <Button onClick={() => navigate("/dashboard/store")} size="lg">
                  Créer ma boutique
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
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  Tableau de bord - {store.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  En ligne
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
            {(error || hookError) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-red-500 rounded-full"></div>
                  <h3 className="font-medium text-red-800">Erreur de chargement</h3>
                </div>
                <p className="text-sm text-red-600 mt-1">{error || hookError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  Réessayer
                </Button>
              </div>
            )}
            <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
              
              {/* Stats Grid */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Produits</CardTitle>
                    <Package className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold mb-1">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground mb-2">{stats.activeProducts} actifs</p>
                    <Badge variant="default" className="text-xs">
                      +{stats.trends.productGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold mb-1">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground mb-2">{stats.pendingOrders} en attente</p>
                    <Badge variant="default" className="text-xs">
                      +{stats.trends.orderGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
                    <Users className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold mb-1">{stats.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground mb-2">Clients enregistrés</p>
                    <Badge variant="default" className="text-xs">
                      +{stats.trends.customerGrowth}%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Revenus</CardTitle>
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold mb-1">{stats.totalRevenue.toLocaleString()} FCFA</div>
                    <p className="text-xs text-muted-foreground mb-2">Total des ventes</p>
                    <Badge variant="default" className="text-xs">
                      +{stats.trends.revenueGrowth}%
                    </Badge>
                  </CardContent>
                </Card>
                </div>

                {/* Quick Actions */}
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="cursor-pointer shadow-soft hover:shadow-medium transition-smooth hover-scale group" onClick={handleCreateProduct}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <Package className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">Nouveau Produit</h3>
                            <p className="text-xs text-muted-foreground mt-1">Ajouter un produit à votre boutique</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer shadow-soft hover:shadow-medium transition-smooth hover-scale group" onClick={handleCreateOrder}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <ShoppingCart className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">Nouvelle Commande</h3>
                            <p className="text-xs text-muted-foreground mt-1">Créer une commande manuelle</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer shadow-soft hover:shadow-medium transition-smooth hover-scale group" onClick={handleViewAnalytics}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <Activity className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">Analytics</h3>
                            <p className="text-xs text-muted-foreground mt-1">Voir les statistiques détaillées</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Row */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            <Bell className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString('fr-FR')}
                              </span>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Activité Récente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            <Activity className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">{activity.message}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString('fr-FR')}
                              </span>
                              {activity.status && (
                                <Badge variant="outline" className="text-xs">
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

                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Paramètres Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" onClick={handleViewStore}>
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres Boutique
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={handleManageCustomers}>
                        <Users className="h-4 w-4 mr-2" />
                        Gérer les Clients
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={handleSettings}>
                        <Settings className="h-4 w-4 mr-2" />
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