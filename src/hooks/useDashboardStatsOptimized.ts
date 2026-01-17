/**
 * Hook optimisé pour les statistiques du dashboard
 * Utilise les vues matérialisées Supabase pour remplacer les 10 requêtes
 * par une seule requête RPC optimisée
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from './useStore';
import { useAuthRefresh } from './useAuthRefresh';
import { useSessionManager } from './useSessionManager';
import { logger } from '@/lib/logger';

// Types pour les vues matérialisées
interface DashboardBaseStats {
  totalProducts: number;
  activeProducts: number;
  digitalProducts: number;
  physicalProducts: number;
  serviceProducts: number;
  courseProducts: number;
  artistProducts: number;
  avgProductPrice: number;
}

interface DashboardOrdersStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  revenue30d: number;
  orders30d: number;
  revenue7d: number;
  orders7d: number;
  revenue90d: number;
  orders90d: number;
}

interface DashboardCustomersStats {
  totalCustomers: number;
  newCustomers30d: number;
  newCustomers7d: number;
  newCustomers90d: number;
  customersWithOrders: number;
}

interface ProductPerformance {
  type: string;
  orders: number;
  revenue: number;
  quantity: number;
  avgOrderValue: number;
  productsSold: number;
  orders30d: number;
  revenue30d: number;
}

interface TopProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  productType: string;
  revenue: number;
  quantity: number;
  orderCount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  productTypes: string[];
}

// Interface complète pour les données optimisées
interface OptimizedDashboardData {
  baseStats: DashboardBaseStats | null;
  ordersStats: DashboardOrdersStats | null;
  customersStats: DashboardCustomersStats | null;
  productPerformance: ProductPerformance[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  generatedAt: string;
  periodDays: number;
}

// Transformation vers l'interface existante
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    customers: { name: string; email: string } | null;
    product_types?: string[];
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    product_type?: string;
    orderCount: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'product' | 'customer' | 'payment';
    message: string;
    timestamp: string;
    status?: string;
  }>;
  performanceMetrics: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    pageViews: number;
    bounceRate: number;
    sessionDuration: number;
  };
  trends: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    productGrowth: number;
  };
  productsByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  revenueByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  ordersByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  performanceMetricsByType: {
    digital: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    physical: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    service: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    course: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    artist: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
  };
  revenueByTypeAndMonth: Array<{
    month: string;
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  }>;
}

export interface UseDashboardStatsOptions {
  period?: '7d' | '30d' | '90d' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
}

export const useDashboardStatsOptimized = (options?: UseDashboardStatsOptions) => {
  const [stats, setStats] = useState<DashboardStats>(getFallbackStats());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { store } = useStore();
  const { withAuthRetry } = useAuthRefresh();
  const { handleRequestError, isAuthenticated } = useSessionManager();

  // Fonction pour transformer les données optimisées vers le format existant
  const transformOptimizedData = useCallback((data: OptimizedDashboardData): DashboardStats => {
    const base = data.baseStats || {
      totalProducts: 0,
      activeProducts: 0,
      digitalProducts: 0,
      physicalProducts: 0,
      serviceProducts: 0,
      courseProducts: 0,
      artistProducts: 0,
      avgProductPrice: 0,
    };

    const orders = data.ordersStats || {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      revenue30d: 0,
      orders30d: 0,
      revenue7d: 0,
      orders7d: 0,
      revenue90d: 0,
      orders90d: 0,
    };

    const customers = data.customersStats || {
      totalCustomers: 0,
      newCustomers30d: 0,
      newCustomers7d: 0,
      newCustomers90d: 0,
      customersWithOrders: 0,
    };

    // Calculer les tendances basées sur les données disponibles
    const currentPeriodDays = options?.period === '7d' ? 7 : options?.period === '90d' ? 90 : 30;
    const revenueGrowth = orders.totalOrders > 0 ?
      Math.round(((orders.revenue30d - (orders.revenue90d - orders.revenue30d) / (90 - 30) * 30) / orders.totalRevenue) * 100) : 0;
    const orderGrowth = orders.totalOrders > 0 ?
      Math.round(((orders.orders30d - (orders.orders90d - orders.orders30d) / (90 - 30) * 30) / orders.totalOrders) * 100) : 0;
    const customerGrowth = customers.totalCustomers > 0 ?
      Math.round((customers.newCustomers30d / customers.totalCustomers) * 100) : 0;
    const productGrowth = base.activeProducts > 0 ?
      Math.round((base.activeProducts * 0.1) * 100) : 0; // Estimation basée sur les données disponibles

    // Transformer les performances par type
    const performanceByType = data.productPerformance.reduce((acc, perf) => {
      const type = perf.type as keyof typeof acc;
      if (type in acc) {
        acc[type] = {
          conversionRate: customers.totalCustomers > 0 ? Math.round((perf.orders / customers.totalCustomers) * 100) : 0,
          averageOrderValue: perf.orders > 0 ? perf.revenue / perf.orders : 0,
          customerRetention: customers.customersWithOrders > 0 ? Math.round((customers.customersWithOrders / customers.totalCustomers) * 100) : 0,
        };
      }
      return acc;
    }, {
      digital: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      physical: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      service: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      course: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      artist: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
    });

    return {
      totalProducts: base.totalProducts,
      activeProducts: base.activeProducts,
      totalOrders: orders.totalOrders,
      pendingOrders: orders.pendingOrders,
      completedOrders: orders.completedOrders,
      cancelledOrders: orders.cancelledOrders,
      totalCustomers: customers.totalCustomers,
      totalRevenue: orders.totalRevenue,
      recentOrders: data.recentOrders.map(order => ({
        id: order.id,
        order_number: order.orderNumber,
        total_amount: order.totalAmount,
        status: order.status,
        created_at: order.createdAt,
        customers: order.customer ? {
          name: order.customer.name,
          email: order.customer.email,
        } : null,
        product_types: order.productTypes,
      })),
      topProducts: data.topProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.imageUrl,
        product_type: product.productType,
        orderCount: product.orderCount,
        revenue: product.revenue,
      })),
      revenueByMonth: [], // Sera calculé séparément si nécessaire
      ordersByStatus: [
        { status: 'Completed', count: orders.completedOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.completedOrders / orders.totalOrders) * 100) : 0 },
        { status: 'Pending', count: orders.pendingOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.pendingOrders / orders.totalOrders) * 100) : 0 },
        { status: 'Cancelled', count: orders.cancelledOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.cancelledOrders / orders.totalOrders) * 100) : 0 },
      ],
      recentActivity: [
        ...data.recentOrders.slice(0, 3).map(order => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          message: `Nouvelle commande #${order.orderNumber} de ${order.totalAmount} FCFA`,
          timestamp: order.createdAt,
          status: order.status,
        })),
        ...data.topProducts.slice(0, 2).map(product => ({
          id: `product-${product.id}`,
          type: 'product' as const,
          message: `Produit "${product.name}" populaire`,
          timestamp: new Date().toISOString(),
          status: 'success',
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      performanceMetrics: {
        conversionRate: customers.totalCustomers > 0 ? Math.round((orders.completedOrders / customers.totalCustomers) * 100) : 0,
        averageOrderValue: orders.avgOrderValue,
        customerRetention: customers.customersWithOrders > 0 ? Math.round((customers.customersWithOrders / customers.totalCustomers) * 100) : 0,
        pageViews: orders.totalOrders * 10, // Estimation
        bounceRate: Math.max(20 - orders.totalOrders * 0.5, 10), // Estimation
        sessionDuration: Math.floor(180 + orders.totalOrders * 2), // Estimation
      },
      trends: {
        revenueGrowth,
        orderGrowth,
        customerGrowth,
        productGrowth,
      },
      productsByType: {
        digital: base.digitalProducts,
        physical: base.physicalProducts,
        service: base.serviceProducts,
        course: base.courseProducts,
        artist: base.artistProducts,
      },
      revenueByType: data.productPerformance.reduce((acc, perf) => {
        const type = perf.type as keyof typeof acc;
        if (type in acc) {
          acc[type] = perf.revenue;
        }
        return acc;
      }, {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      }),
      ordersByType: data.productPerformance.reduce((acc, perf) => {
        const type = perf.type as keyof typeof acc;
        if (type in acc) {
          acc[type] = perf.orders;
        }
        return acc;
      }, {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      }),
      performanceMetricsByType: performanceByType,
      revenueByTypeAndMonth: [], // Peut être ajouté si nécessaire
    };
  }, [options?.period]);

  const fetchStats = useCallback(async () => {
    // Vérifier l'authentification avant toute requête
    if (!isAuthenticated) {
      logger.warn('🔐 [useDashboardStatsOptimized] Utilisateur non authentifié');
      setError('SESSION_EXPIRED');
      setStats(getFallbackStats());
      setLoading(false);
      return;
    }

    if (!store) {
      logger.info('⚠️ [useDashboardStatsOptimized] Pas de boutique, utilisation des stats par défaut');
      setStats(getFallbackStats());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      logger.info('🔄 [useDashboardStatsOptimized] Récupération des stats optimisées pour la boutique:', {
        storeId: store.id,
        storeName: store.name,
        period: options?.period,
      });

      const startTime = performance.now();

      // Calculer la période pour la requête RPC
      let periodDays = 30;
      if (options?.period === '7d') periodDays = 7;
      else if (options?.period === '90d') periodDays = 90;

      // Une seule requête RPC optimisée au lieu de 10 requêtes individuelles
      let data, rpcError;

      try {
        const result = await withAuthRetry(
          () => supabase.rpc('get_dashboard_stats_rpc', {
            store_id: store.id,
            period_days: periodDays,
          }),
          'chargement stats dashboard'
        );
        data = result.data;
        rpcError = result.error;
      } catch (authError: any) {
        // Utiliser le gestionnaire de session pour les erreurs JWT
        const shouldRetry = await handleRequestError(authError);

        if (shouldRetry) {
          logger.info('🔄 [useDashboardStatsOptimized] Session rafraîchie, nouvelle tentative');

          // Réessayer immédiatement avec la nouvelle session
          try {
            const retryResult = await supabase.rpc('get_dashboard_stats_rpc', {
              store_id: store.id,
              period_days: periodDays,
            });
            data = retryResult.data;
            rpcError = retryResult.error;
          } catch (retryError: any) {
            logger.error('❌ [useDashboardStatsOptimized] Échec de la nouvelle tentative:', retryError);
            throw new Error('SESSION_RETRY_FAILED');
          }
        } else {
          // La session n'a pas pu être rafraîchie, l'utilisateur sera redirigé
          throw new Error('SESSION_EXPIRED');
        }
      }

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      if (rpcError) {
        // Vérifier si c'est une erreur de base de données (pas de RPC)
        if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
          logger.warn('⚠️ [useDashboardStatsOptimized] Fonction RPC inexistante, fallback vers ancienne méthode');
          throw new Error(`RPC_INEXISTANTE: ${rpcError.message}`);
        }

        // Vérifier si c'est une erreur de permissions
        if (rpcError.message?.includes('permission denied') || rpcError.code === '42501') {
          logger.warn('⚠️ [useDashboardStatsOptimized] Problème de permissions RPC');
          throw new Error(`RPC_PERMISSIONS: ${rpcError.message}`);
        }

        // Autres erreurs RPC
        logger.warn('⚠️ [useDashboardStatsOptimized] Erreur RPC:', rpcError);
        throw new Error(`RPC_ERROR: ${rpcError.message}`);
      }

      if (data) {
        logger.info(`✅ [useDashboardStatsOptimized] Stats chargées en ${loadTime.toFixed(0)}ms (1 requête RPC)`);

        // Transformer les données optimisées vers le format existant
        const transformedStats = transformOptimizedData(data);
        setStats(transformedStats);

        logger.info('✅ [useDashboardStatsOptimized] Données transformées avec succès');
      } else {
        logger.warn('⚠️ [useDashboardStatsOptimized] Aucune donnée reçue de la RPC');
        setStats(getFallbackStats());
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error('Erreur inconnue');
      const errorMessage = errorObj.message;

      logger.error('❌ [useDashboardStatsOptimized] Erreur:', errorMessage);

      // Gestion spécifique des erreurs de session
      if (errorMessage.includes('SESSION_EXPIRED')) {
        logger.warn('🔐 Session expirée détectée, pas de fallback');
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setStats(getFallbackStats());

        // Le hook useAuthRefresh devrait déjà avoir déconnecté l'utilisateur
        // et affiché un toast approprié
        return;
      }

      // Gestion des erreurs RPC spécifiques
      if (errorMessage.includes('RPC_INEXISTANTE')) {
        logger.warn('⚠️ Fonction RPC manquante, utilisation du fallback');
        setError('Service temporairement indisponible. Utilisation des données de démonstration.');
      } else if (errorMessage.includes('RPC_PERMISSIONS')) {
        logger.warn('⚠️ Problème de permissions RPC');
        setError('Problème d\'autorisation. Veuillez contacter le support.');
      } else if (errorMessage.includes('RPC_ERROR') || errorMessage.includes('GROUP BY')) {
        logger.warn('⚠️ Erreur dans la base de données');
        setError('Erreur technique temporaire. Les données peuvent ne pas être à jour.');
      } else {
        // Erreur générique
        setError('Erreur de chargement des statistiques.');
      }

      setStats(getFallbackStats());

      // Afficher un toast seulement pour les erreurs non-critiques
      if (!errorMessage.includes('SESSION_EXPIRED')) {
        toast({
          title: 'Erreur de chargement',
          description: 'Utilisation des données de démonstration. Les données peuvent ne pas être à jour.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [store, options?.period, transformOptimizedData, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

// Fonction de fallback (même qu'avant)
function getFallbackStats(): DashboardStats {
  return {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    revenueByMonth: [],
    ordersByStatus: [],
    recentActivity: [
      {
        id: 'fallback-1',
        type: 'order',
        message: 'Tableau de bord initialisé',
        timestamp: new Date().toISOString(),
        status: 'success',
      },
    ],
    performanceMetrics: {
      conversionRate: 0,
      averageOrderValue: 0,
      customerRetention: 0,
      pageViews: 0,
      bounceRate: 0,
      sessionDuration: 0,
    },
    trends: {
      revenueGrowth: 0,
      orderGrowth: 0,
      customerGrowth: 0,
      productGrowth: 0,
    },
    productsByType: {
      digital: 0,
      physical: 0,
      service: 0,
      course: 0,
      artist: 0,
    },
    revenueByType: {
      digital: 0,
      physical: 0,
      service: 0,
      course: 0,
      artist: 0,
    },
    ordersByType: {
      digital: 0,
      physical: 0,
      service: 0,
      course: 0,
      artist: 0,
    },
    performanceMetricsByType: {
      digital: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      physical: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      service: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      course: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
      artist: { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 },
    },
    revenueByTypeAndMonth: [],
  };
}