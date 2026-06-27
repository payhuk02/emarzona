/**
 * Admin Analytics Dashboard
 * Analytics globales de la plateforme (données réelles via RPC admin)
 */

import { useMemo, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Store,
  Activity,
  MousePointerClick,
  Target,
  Rocket,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPlatformAnalytics } from '@/hooks/useAdminPlatformAnalytics';
import { formatGrowthLabel, productTypeLabel } from '@/lib/admin/admin-platform-analytics';
import { cn } from '@/lib/utils';

type PhysicalConversionSnapshot = {
  loading: boolean;
  onboardingViews: number;
  trialClicks: number;
  billingClicks: number;
};

const INITIAL_SNAPSHOT: PhysicalConversionSnapshot = {
  loading: true,
  onboardingViews: 0,
  trialClicks: 0,
  billingClicks: 0,
};

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  physical: 'bg-blue-500',
  digital: 'bg-green-500',
  service: 'bg-purple-500',
  course: 'bg-orange-500',
  artist: 'bg-pink-500',
  unknown: 'bg-muted-foreground',
};

function GrowthHint({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <p className={cn('text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1')}>
      <Icon className={cn('h-3 w-3', positive ? 'text-green-600' : 'text-red-600')} />
      {formatGrowthLabel(value)}
    </p>
  );
}

export default function AdminAnalytics() {
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const chartsRef = useScrollAnimation<HTMLDivElement>();
  const [physicalSnapshot, setPhysicalSnapshot] =
    useState<PhysicalConversionSnapshot>(INITIAL_SNAPSHOT);

  const { data: analytics, isLoading, error } = useAdminPlatformAnalytics(30);

  useEffect(() => {
    logger.info('Admin Analytics page chargée');
  }, []);

  useEffect(() => {
    let active = true;

    const loadPhysicalConversionSnapshot = async () => {
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const eventTypes = [
          'physical_onboarding_seen',
          'trial_continue_clicked',
          'billing_cta_clicked',
        ] as const;

        const results = await Promise.all(
          eventTypes.map(async eventType => {
            const { count, error: countError } = await supabase
              .from('store_analytics_events')
              .select('id', { count: 'exact', head: true })
              .eq('event_type', eventType)
              .gte('created_at', since);

            if (countError) throw countError;
            return { eventType, count: count ?? 0 };
          })
        );

        if (!active) return;

        const byType = Object.fromEntries(results.map(r => [r.eventType, r.count])) as Record<
          (typeof eventTypes)[number],
          number
        >;

        setPhysicalSnapshot({
          loading: false,
          onboardingViews: byType.physical_onboarding_seen,
          trialClicks: byType.trial_continue_clicked,
          billingClicks: byType.billing_cta_clicked,
        });
      } catch (loadError) {
        if (!active) return;
        logger.error('Erreur chargement conversion snapshot', { error: loadError });
        setPhysicalSnapshot(prev => ({ ...prev, loading: false }));
      }
    };

    void loadPhysicalConversionSnapshot();
    return () => {
      active = false;
    };
  }, []);

  const trialRate = useMemo(() => {
    if (physicalSnapshot.onboardingViews === 0) return 0;
    return (physicalSnapshot.trialClicks / physicalSnapshot.onboardingViews) * 100;
  }, [physicalSnapshot.onboardingViews, physicalSnapshot.trialClicks]);

  const billingRate = useMemo(() => {
    if (physicalSnapshot.onboardingViews === 0) return 0;
    return (physicalSnapshot.billingClicks / physicalSnapshot.onboardingViews) * 100;
  }, [physicalSnapshot.onboardingViews, physicalSnapshot.billingClicks]);

  const maxProductTypeRevenue = useMemo(() => {
    if (!analytics?.revenueByProductType.length) return 1;
    return Math.max(...analytics.revenueByProductType.map(r => r.revenue), 1);
  }, [analytics?.revenueByProductType]);

  const maxMonthlyRevenue = useMemo(() => {
    if (!analytics?.monthlyRevenue.length) return 1;
    return Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1);
  }, [analytics?.monthlyRevenue]);

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div
          ref={headerRef}
          role="banner"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1
              className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight"
              id="admin-analytics-title"
            >
              Analytics Plateforme
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Données agrégées sur les {analytics?.periodDays ?? 30} derniers jours
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Impossible de charger les analytics plateforme : {error.message}
            </CardContent>
          </Card>
        )}

        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          role="region"
          aria-label="Statistiques principales"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Revenu (période)
                  </CardTitle>
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {Math.round(analytics?.totalRevenue ?? 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <GrowthHint value={analytics?.revenueGrowthPct ?? 0} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Commandes
                  </CardTitle>
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {analytics?.totalOrders ?? 0}
                  </div>
                  <GrowthHint value={analytics?.ordersGrowthPct ?? 0} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Utilisateurs
                  </CardTitle>
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {analytics?.totalUsers ?? 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    +{analytics?.newUsersPeriod ?? 0} sur la période
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Boutiques
                  </CardTitle>
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {analytics?.totalStores ?? 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    +{analytics?.newStoresPeriod ?? 0} sur la période
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Produits actifs
                  </CardTitle>
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {analytics?.activeProducts ?? 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {analytics?.totalProducts ?? 0} au total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Taux paiement
                  </CardTitle>
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {(analytics?.paymentConversionRate ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {analytics?.paidOrders ?? 0} commandes payées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                    Panier moyen
                  </CardTitle>
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-xl md:text-2xl font-bold">
                    {Math.round(analytics?.averageOrderValue ?? 0).toLocaleString('fr-FR')} FCFA
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Acheteurs actifs (7j)</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.activeUsers7d ?? 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div
          ref={chartsRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          role="region"
          aria-label="Graphiques analytiques"
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenus mensuels</CardTitle>
              <CardDescription>12 derniers mois (commandes payées)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : analytics?.monthlyRevenue.length ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {analytics.monthlyRevenue.map(item => (
                    <div key={item.month} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{item.month}</span>
                        <span className="text-muted-foreground">
                          {Math.round(item.revenue).toLocaleString('fr-FR')} FCFA • {item.orders}{' '}
                          cmd
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(item.revenue / maxMonthlyRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucun revenu enregistré sur 12 mois.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commandes par verticale</CardTitle>
              <CardDescription>Répartition des ventes payées (période)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : analytics?.revenueByProductType.length ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {analytics.revenueByProductType.map(item => (
                    <div key={item.product_type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{productTypeLabel(item.product_type)}</span>
                        <span className="text-muted-foreground">
                          {Math.round(item.revenue).toLocaleString('fr-FR')} FCFA • {item.orders}{' '}
                          cmd
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            PRODUCT_TYPE_COLORS[item.product_type] ?? PRODUCT_TYPE_COLORS.unknown
                          )}
                          style={{ width: `${(item.revenue / maxProductTypeRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucune vente par verticale sur la période.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" aria-hidden />
              Conversion Snapshot - Onboarding Physique
            </CardTitle>
            <CardDescription>
              Funnel 30 jours : vues onboarding → clic essai gratuit → clic abonnement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {physicalSnapshot.loading ? (
              <p className="text-sm text-muted-foreground">Chargement des données de conversion…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Vues onboarding</p>
                  <p className="text-2xl font-bold">{physicalSnapshot.onboardingViews}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Event: physical_onboarding_seen
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Rocket className="h-3.5 w-3.5" aria-hidden />
                    Clic essai gratuit
                  </p>
                  <p className="text-2xl font-bold">{physicalSnapshot.trialClicks}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trialRate.toFixed(1)}% des vues onboarding
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                    Clic abonnement
                  </p>
                  <p className="text-2xl font-bold">{physicalSnapshot.billingClicks}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {billingRate.toFixed(1)}% des vues onboarding
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
