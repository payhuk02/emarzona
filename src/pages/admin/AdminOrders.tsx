import { useMemo, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoxIcon, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminOrders() {
  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Mock data - à remplacer par vraies données
  const stats = useMemo(
    () => ({
      total: 1247,
      pending: 45,
      processing: 78,
      shipped: 892,
      delivered: 198,
      totalRevenue: 45780,
    }),
    []
  );

  useEffect(() => {
    logger.info('Admin Orders page chargée');
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            <Admin2FABanner />
            {/* Header avec animation - Style Inventory */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
              role="banner"
            >
              <div>
                <h1
                  className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
                  id="admin-orders-title"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <BoxIcon
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion Commandes Globales
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Vue administrateur de toutes les commandes de la plateforme
                </p>
              </div>
            </div>

            {/* Stats Cards - Style Inventory */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label="Statistiques des commandes"
            >
              {[
                {
                  label: 'Total Commandes',
                  value: stats.total,
                  icon: Package,
                  color: 'from-purple-600 to-pink-600',
                  description: 'Toutes les commandes',
                },
                {
                  label: 'En Traitement',
                  value: stats.processing,
                  icon: TrendingUp,
                  color: 'from-blue-600 to-cyan-600',
                  description: 'Commandes en cours',
                },
                {
                  label: 'Livrées',
                  value: stats.delivered,
                  icon: BoxIcon,
                  color: 'from-green-600 to-emerald-600',
                  description: 'Ce mois-ci',
                },
                {
                  label: 'Revenu Total',
                  value: `${stats.totalRevenue.toLocaleString()} FCFA`,
                  icon: DollarSign,
                  color: 'from-yellow-600 to-orange-600',
                  description: 'Toutes commandes',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div
                        className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Table */}
            <ProtectedAction
              permission="orders.manage"
              fallback={
                <Card>
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                      Liste des Commandes
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Accès restreint
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="text-center py-8 sm:py-10 md:py-12 text-muted-foreground text-xs sm:text-sm md:text-base">
                      Vous n'avez pas la permission de gérer les commandes.
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                    Liste des Commandes
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                    Gérez toutes les commandes de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div
                    className="text-center py-8 sm:py-10 md:py-12 text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <BoxIcon
                      className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4"
                      aria-hidden="true"
                    />
                    <p className="text-xs sm:text-sm md:text-base">
                      Fonctionnalité en développement
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm mt-1.5 sm:mt-2">
                      La liste complète des commandes sera bientôt disponible
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ProtectedAction>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






