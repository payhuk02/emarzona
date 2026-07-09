import { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserPlus,
  BarChart3,
  Clock,
  Scale,
  Globe,
  LayoutGrid,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { convertCurrency } from '@/lib/currency-converter';

const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();
  const location = useLocation();
  const { toast } = useToast();
  const [apiHealthOk, setApiHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health', { method: 'GET', cache: 'no-store' })
      .then(res => {
        if (!cancelled) setApiHealthOk(res.ok);
      })
      .catch(() => {
        if (!cancelled) setApiHealthOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const usersRef = useScrollAnimation<HTMLDivElement>();
  const storesRef = useScrollAnimation<HTMLDivElement>();

  // Accès refusé par RBAC (redirect depuis AdminRoutePermissionGuard)
  useEffect(() => {
    const state = location.state as { forbiddenPath?: string; role?: string } | null;
    if (state?.forbiddenPath) {
      toast({
        title: 'Accès refusé',
        description: `Votre rôle (${state.role ?? 'admin'}) ne permet pas d'accéder à ${state.forbiddenPath}.`,
        variant: 'destructive',
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  // Logging pour le chargement des stats
  useEffect(() => {
    if (!loading && stats) {
      logger.info(
        `Admin Dashboard stats chargées: ${stats.totalUsers} utilisateurs, ${stats.totalStores} boutiques`
      );
    }
  }, [loading, stats]);

  const statsCards = useMemo(
    () => [
      {
        title: 'Utilisateurs totaux',
        value: stats.totalUsers,
        icon: Users,
        description: `${stats.activeUsers} actifs`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/50',
        href: '/admin/users',
      },
      {
        title: 'Boutiques',
        value: stats.totalStores,
        icon: Store,
        description: 'Boutiques créées',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/50',
        href: '/admin/stores',
      },
      {
        title: 'Produits',
        value: stats.totalProducts,
        icon: Package,
        description: 'Produits actifs',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/50',
        href: '/admin/products',
      },
      {
        title: 'Commandes',
        value: stats.totalOrders,
        icon: ShoppingCart,
        description: 'Commandes totales',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/50',
        href: '/admin/orders',
      },
      {
        title: 'Revenu total',
        value: formatCurrency(stats.totalRevenue),
        icon: DollarSign,
        description: 'Revenue généré',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      },
      {
        title: 'Commissions',
        value: formatCurrency(stats.totalCommissions),
        icon: TrendingUp,
        description: 'Commissions plateforme',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
      },
      {
        title: 'Parrainages',
        value: stats.totalReferrals,
        icon: UserPlus,
        description: 'Parrainages actifs',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50 dark:bg-pink-950/50',
      },
      {
        title: 'MRR plateforme',
        value: formatCurrency(convertCurrency(stats.platformMrr, 'USD', 'XOF'), 'XOF'),
        icon: BarChart3,
        description: `${stats.activeSubscriptions} abonnement(s) actifs / essai`,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50 dark:bg-violet-950/50',
        href: '/admin/vendor-billing',
      },
      {
        title: 'Commandes en attente',
        value: stats.pendingOrders,
        icon: Clock,
        description: 'Paiement pending',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/50',
        href: '/admin/orders',
      },
      {
        title: 'Litiges ouverts',
        value: stats.openDisputes,
        icon: Scale,
        description: 'À traiter',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/50',
        href: '/admin/disputes',
      },
      {
        title: 'Domaines actifs',
        value: stats.activeDomains,
        icon: Globe,
        description: 'Custom domains vérifiés',
        color: 'text-sky-600',
        bgColor: 'bg-sky-50 dark:bg-sky-950/50',
        href: '/admin/domains',
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(11)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          role="banner"
        >
          <div>
            <h1
              className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              id="admin-dashboard-title"
            >
              Tableau de bord administrateur
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
              Vue d'ensemble de la plateforme
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {apiHealthOk !== null && (
              <Badge
                variant={apiHealthOk ? 'default' : 'destructive'}
                className="gap-1 text-xs"
                role="status"
                aria-label={
                  apiHealthOk ? 'API plateforme opérationnelle' : 'API plateforme indisponible'
                }
              >
                <HeartPulse className="h-3 w-3" aria-hidden />
                API {apiHealthOk ? 'OK' : 'KO'}
              </Badge>
            )}
            <div
              className="flex items-center gap-2 text-muted-foreground"
              role="status"
              aria-label="Statistiques globales"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span className="text-xs sm:text-sm">Statistiques globales</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/vendor-billing">Facturation SaaS</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/domains">Domaines</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/feature-flags">Feature flags</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/monitoring">Monitoring</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/advanced-tools">
              <LayoutGrid className="h-3.5 w-3.5 mr-1" aria-hidden />
              Outils avancés
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div
          ref={statsRef}
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="region"
          aria-label="Cartes statistiques"
        >
          {statsCards.map((stat, index) => {
            const card = (
              <Card
                key={index}
                className="hover-scale border-muted/50 hover:border-primary/50 transition-all h-full"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4 lg:p-6">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${stat.color}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-6 pt-0">
                  <div
                    className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${stat.color}`}
                  >
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
            if ('href' in stat && stat.href) {
              return (
                <Link
                  key={index}
                  to={stat.href}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                >
                  {card}
                </Link>
              );
            }
            return card;
          })}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" aria-hidden="true" />
                Utilisateurs récents
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Les 5 derniers utilisateurs inscrits
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div
              ref={usersRef}
              className="space-y-4"
              role="region"
              aria-label="Liste des utilisateurs récents"
            >
              {stats.recentUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-xs sm:text-sm md:text-base">
                      {user.display_name || user.email}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Stores */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                <Store className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5" aria-hidden="true" />
                Top boutiques
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Boutiques avec le plus de ventes
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/stores">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div
              ref={storesRef}
              className="space-y-4"
              role="region"
              aria-label="Liste des top boutiques"
            >
              {stats.topStores.map((store, index) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base">
                      #{index + 1}
                    </div>
                    <p className="font-medium">{store.name}</p>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(store.total_sales)}</p>
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
