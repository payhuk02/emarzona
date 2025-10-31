import { useMemo, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const usersRef = useScrollAnimation<HTMLDivElement>();
  const storesRef = useScrollAnimation<HTMLDivElement>();

  // Logging pour le chargement des stats
  useEffect(() => {
    if (!loading && stats) {
      logger.info(`Admin Dashboard stats chargées: ${stats.totalUsers} utilisateurs, ${stats.totalStores} boutiques`);
    }
  }, [loading, stats]);

  const statsCards = useMemo(() => [
    {
      title: "Utilisateurs totaux",
      value: stats.totalUsers,
      icon: Users,
      description: `${stats.activeUsers} actifs`,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Boutiques",
      value: stats.totalStores,
      icon: Store,
      description: "Boutiques créées",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      title: "Produits",
      value: stats.totalProducts,
      icon: Package,
      description: "Produits actifs",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      title: "Commandes",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "Commandes totales",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
    },
    {
      title: "Revenu total",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: "Revenue généré",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Commissions",
      value: formatCurrency(stats.totalCommissions),
      icon: TrendingUp,
      description: "Commissions plateforme",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
    },
    {
      title: "Parrainages",
      value: stats.totalReferrals,
      icon: UserPlus,
      description: "Parrainages actifs",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/50",
    },
  ], [stats]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" id="admin-dashboard-title">
              Tableau de bord administrateur
            </h1>
            <p className="text-muted-foreground mt-2">
              Vue d'ensemble de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-label="Statistiques globales">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm">Statistiques globales</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div ref={statsRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Cartes statistiques">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover-scale border-muted/50 hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" aria-hidden="true" />
              Utilisateurs récents
            </CardTitle>
            <CardDescription>
              Les 5 derniers utilisateurs inscrits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={usersRef} className="space-y-4" role="region" aria-label="Liste des utilisateurs récents">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{user.display_name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Stores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" aria-hidden="true" />
              Top boutiques
            </CardTitle>
            <CardDescription>
              Boutiques avec le plus de ventes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={storesRef} className="space-y-4" role="region" aria-label="Liste des top boutiques">
              {stats.topStores.map((store, index) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <p className="font-medium">{store.name}</p>
                  </div>
                  <p className="font-bold text-primary">
                    {formatCurrency(store.total_sales)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
