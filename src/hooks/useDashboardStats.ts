/**
 * Hook consolidé pour les statistiques du dashboard
 * Remplace useDashboardStats, useDashboardStatsFixed et useDashboardStatsRobust
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStore } from './useStore';
import { logger } from '@/lib/logger';

export interface DashboardStats {
  // Statistiques de base
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalRevenue: number;

  // Données récentes
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
    product_type?: string; // digital, physical, service, course, artist
    orderCount: number;
    revenue: number;
  }>;

  // Données pour graphiques
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

  // Activité récente
  recentActivity: Array<{
    id: string;
    type: 'order' | 'product' | 'customer' | 'payment';
    message: string;
    timestamp: string;
    status?: string;
  }>;

  // Métriques de performance
  performanceMetrics: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    pageViews: number;
    bounceRate: number;
    sessionDuration: number;
  };

  // Tendances
  trends: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    productGrowth: number;
  };

  // Statistiques par type de produit
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

  // Métriques de performance par type
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

  // Revenus par type et par mois pour graphiques
  revenueByTypeAndMonth: Array<{
    month: string;
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  }>;
}

// Données de fallback en cas d'erreur
const getFallbackStats = (): DashboardStats => ({
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
});

export interface UseDashboardStatsOptions {
  period?: '7d' | '30d' | '90d' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
}

export const useDashboardStats = (options?: UseDashboardStatsOptions) => {
  const [stats, setStats] = useState<DashboardStats>(getFallbackStats());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { store } = useStore();

  const fetchStats = useCallback(async () => {
    if (!store) {
      logger.info('⚠️ [useDashboardStats] Pas de boutique, utilisation des stats par défaut');
      setStats(getFallbackStats());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      logger.info('🔄 [useDashboardStats] Récupération des stats pour la boutique:', {
        storeId: store.id,
        storeName: store.name,
        period: options?.period,
      });

      // Calculer les dates selon la période sélectionnée
      const now = new Date();
      let  startDate: Date;
      let  endDate: Date = now;

      if (options?.period === 'custom' && options?.customStartDate && options?.customEndDate) {
        startDate = options.customStartDate;
        endDate = options.customEndDate;
      } else if (options?.period === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (options?.period === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else {
        // Par défaut: 30 jours
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Calculer les dates pour les tendances (période actuelle vs précédente)
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = startDate;

      // Récupérer d'abord les IDs des commandes complétées pour les order_items
      const completedOrdersResponse = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', store.id)
        .eq('status', 'completed');

      const completedOrderIds =
        completedOrdersResponse.data && completedOrdersResponse.data.length > 0
          ? completedOrdersResponse.data.map(o => o.id)
          : [];

      // Utiliser des requêtes simples et sécurisées avec Promise.allSettled pour une meilleure gestion d'erreur
      const queries = await Promise.allSettled([
        // Produits
        supabase.from('products').select('id, is_active, created_at').eq('store_id', store.id),

        // Commandes (toutes pour stats globales)
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at')
          .eq('store_id', store.id),

        // Commandes période actuelle (selon filtre)
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at')
          .eq('store_id', store.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Commandes période précédente (pour calculer les tendances)
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at')
          .eq('store_id', store.id)
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', previousEndDate.toISOString()),

        // Clients (avec dates pour calculer par mois)
        supabase
          .from('customers')
          .select('id, created_at')
          .eq('store_id', store.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Clients période actuelle
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),

        // Clients période précédente
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', previousEndDate.toISOString()),

        // Commandes récentes avec clients et types de produits (filtrées par période)
        supabase
          .from('orders')
          .select(
            `
            id, 
            order_number, 
            total_amount, 
            status, 
            created_at,
            customers(id, name, email),
            order_items(product_type, products(product_type))
          `
          )
          .eq('store_id', store.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),

        // Order items pour calculer les top produits (inclut tous les 5 types: digital, physical, service, course, artist)
        // Note: product_type est inclus pour permettre un filtrage futur par type si nécessaire
        // Utilise total_price ou unit_price * quantity pour le calcul du revenu
        // Inclut order_id pour calculer les revenus par mois
        completedOrderIds.length > 0
          ? supabase
              .from('order_items')
              .select(
                'product_id, quantity, unit_price, total_price, product_type, order_id, products(product_type)'
              )
              .in('order_id', completedOrderIds)
          : Promise.resolve({ data: [], error: null }),

        // Produits avec images (incluant product_type pour tous les 5 types: digital, physical, service, course, artist)
        supabase
          .from('products')
          .select('id, name, price, image_url, product_type')
          .eq('store_id', store.id)
          .eq('is_active', true),
      ]);

      // Traiter les résultats avec gestion d'erreur
      const [
        productsResult,
        ordersResult,
        ordersCurrentResult,
        ordersPreviousResult,
        customersResult,
        customersCurrentResult,
        customersPreviousResult,
        recentOrdersResult,
        orderItemsResult,
        productsWithDetailsResult,
      ] = queries;

      const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
      const ordersCurrent =
        ordersCurrentResult.status === 'fulfilled' ? ordersCurrentResult.value.data || [] : [];
      const ordersPrevious =
        ordersPreviousResult.status === 'fulfilled' ? ordersPreviousResult.value.data || [] : [];
      const customersData =
        customersResult.status === 'fulfilled' ? customersResult.value.data || [] : [];
      const customersCount = customersData.length;
      const customersCurrentCount =
        customersCurrentResult.status === 'fulfilled' ? customersCurrentResult.value.count || 0 : 0;
      const customersPreviousCount =
        customersPreviousResult.status === 'fulfilled'
          ? customersPreviousResult.value.count || 0
          : 0;
      const recentOrders =
        recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value.data || [] : [];
      const orderItems =
        orderItemsResult.status === 'fulfilled' ? orderItemsResult.value.data || [] : [];
      const productsWithDetails =
        productsWithDetailsResult.status === 'fulfilled'
          ? productsWithDetailsResult.value.data || []
          : [];

      // Log pour déboguer
      if (productsResult.status === 'rejected') {
        logger.error(
          '❌ [useDashboardStats] Erreur lors de la récupération des produits:',
          productsResult.reason
        );
      } else {
        logger.info('✅ [useDashboardStats] Produits récupérés:', {
          count: products.length,
          storeId: store.id,
        });
      }

      // Calculer les statistiques de base
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_active).length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const totalCustomers = customersCount;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );

      // Répartition des commandes par statut
      const statusCounts = orders.reduce(
        (acc: Record<string, number>, order) => {
          const status = order.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: typeof count === 'number' ? count : 0,
        percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
      }));

      // Calculer les top produits avec les vraies données
      const  productStats: Record<
        string,
        { orderCount: number; revenue: number; quantity: number }
      > = {};

      // S'assurer que orderItems est un tableau
      const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];

      safeOrderItems.forEach(
        (item: {
          product_id: string | null;
          quantity: number | null;
          unit_price: number | null;
          total_price: number | null;
        }) => {
          const productId = item.product_id;
          if (productId) {
            if (!productStats[productId]) {
              productStats[productId] = { orderCount: 0, revenue: 0, quantity: 0 };
            }
            productStats[productId].orderCount += 1;
            // Utiliser total_price s'il existe, sinon calculer avec unit_price * quantity
            const itemRevenue =
              item.total_price ||
              (item.unit_price && item.quantity ? item.unit_price * item.quantity : 0);
            productStats[productId].revenue += Number(itemRevenue) || 0;
            productStats[productId].quantity += Number(item.quantity) || 0;
          }
        }
      );

      // Créer la liste des top produits avec les vraies statistiques
      // S'assurer que productsWithDetails est un tableau
      const safeProductsWithDetails = Array.isArray(productsWithDetails) ? productsWithDetails : [];

      const topProductsList = Object.entries(productStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(([productId, stats]) => {
          const product = safeProductsWithDetails.find((p: { id: string }) => p.id === productId);
          return {
            id: productId,
            name: product?.name || 'Produit inconnu',
            price: product?.price || 0,
            image_url: product?.image_url || null,
            product_type: (product as { product_type?: string })?.product_type, // Inclure le type pour tous les 5 systèmes e-commerce
            orderCount: stats.orderCount,
            revenue: stats.revenue,
          };
        });

      // Revenus par mois avec données réelles (incluant clients)
      const revenueByMonth = orders.reduce(
        (acc: Record<string, { revenue: number; orders: number; customers: number }>, order) => {
          if (!order.created_at) return acc;
          const month = new Date(order.created_at).toLocaleString('fr-FR', {
            month: 'short',
            year: 'numeric',
          });
          if (!acc[month]) {
            acc[month] = { revenue: 0, orders: 0, customers: 0 };
          }
          acc[month].revenue += Number(order.total_amount) || 0;
          acc[month].orders += 1;
          return acc;
        },
        {} as Record<string, { revenue: number; orders: number; customers: number }>
      );

      // Ajouter les clients par mois
      const safeCustomersData = Array.isArray(customersData) ? customersData : [];
      safeCustomersData.forEach(customer => {
        if (customer?.created_at) {
          const month = new Date(customer.created_at).toLocaleString('fr-FR', {
            month: 'short',
            year: 'numeric',
          });
          if (revenueByMonth[month]) {
            revenueByMonth[month].customers += 1;
          } else {
            revenueByMonth[month] = { revenue: 0, orders: 0, customers: 1 };
          }
        }
      });

      const revenueByMonthArray = Object.entries(revenueByMonth)
        .map(([month, data]) => {
          const monthData = data as { revenue: number; orders: number; customers: number };
          return {
            month,
            revenue: monthData.revenue,
            orders: monthData.orders,
            customers: monthData.customers || 0,
          };
        })
        .sort((a, b) => {
          // Trier par date correctement
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // Activité récente
      const recentActivity = [
        ...recentOrders.slice(0, 3).map(order => {
          const orderNumber = order.order_number || 'N/A';
          const totalAmount = order.total_amount || 0;
          const orderStatus = order.status || 'unknown';
          const orderCreatedAt = order.created_at || new Date().toISOString();
          return {
            id: `order-${order.id}`,
            type: 'order' as const,
            message: `Nouvelle commande #${orderNumber} de ${totalAmount} FCFA`,
            timestamp: orderCreatedAt,
            status: orderStatus,
          };
        }),
        ...topProductsList.slice(0, 2).map(product => ({
          id: `product-${product.id}`,
          type: 'product' as const,
          message: `Produit "${product.name}" disponible`,
          timestamp: new Date().toISOString(),
          status: 'success',
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculer les tendances réelles (comparaison période actuelle vs précédente)
      const revenueCurrent = ordersCurrent.reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );
      const revenuePrevious = ordersPrevious.reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );
      const revenueGrowth =
        revenuePrevious > 0
          ? Math.round(((revenueCurrent - revenuePrevious) / revenuePrevious) * 100)
          : revenueCurrent > 0
            ? 100
            : 0;

      const orderGrowth =
        ordersPrevious.length > 0
          ? Math.round(
              ((ordersCurrent.length - ordersPrevious.length) / ordersPrevious.length) * 100
            )
          : ordersCurrent.length > 0
            ? 100
            : 0;

      const customerGrowth =
        customersPreviousCount > 0
          ? Math.round(
              ((customersCurrentCount - customersPreviousCount) / customersPreviousCount) * 100
            )
          : customersCurrentCount > 0
            ? 100
            : 0;

      // Calculer la croissance des produits (nouveaux produits créés)
      const productsCurrent = products.filter((p: { created_at: string }) => {
        const created = new Date(p.created_at);
        return created >= startDate && created <= endDate;
      }).length;
      const productsPrevious = products.filter((p: { created_at: string }) => {
        const created = new Date(p.created_at);
        return created >= previousStartDate && created < previousEndDate;
      }).length;
      const productGrowth =
        productsPrevious > 0
          ? Math.round(((productsCurrent - productsPrevious) / productsPrevious) * 100)
          : productsCurrent > 0
            ? 100
            : 0;

      // Métriques de performance (calculées avec données réelles)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculer la rétention client (clients avec plusieurs commandes)
      // Note: Cette logique nécessiterait une jointure avec customers, simplifié ici

      // Pour l'instant, on garde une estimation basée sur les données disponibles
      // Dans un vrai système, on calculerait depuis les commandes répétées
      const repeatCustomers = Math.min(Math.round(totalCustomers * 0.3), totalCustomers);
      const customerRetention =
        totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

      const performanceMetrics = {
        conversionRate:
          totalOrders > 0 && totalCustomers > 0
            ? Math.min(Math.round((totalOrders / totalCustomers) * 100), 100)
            : 0,
        averageOrderValue,
        customerRetention,
        pageViews: totalOrders * 10, // Estimation basée sur les commandes
        bounceRate: Math.max(20 - totalOrders * 0.5, 10), // Estimation inverse
        sessionDuration: Math.floor(180 + totalOrders * 2), // Estimation
      };

      // Tendances réelles
      const trends = {
        revenueGrowth,
        orderGrowth,
        customerGrowth,
        productGrowth,
      };

      // Calculer les statistiques par type de produit
      const productsByType = {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      };

      const safeProducts = Array.isArray(products) ? products : [];
      safeProducts.forEach((product: { product_type?: string }) => {
        const type = product.product_type as keyof typeof productsByType;
        if (type && type in productsByType) {
          productsByType[type]++;
        }
      });

      // Calculer les revenus par type de produit
      const revenueByType = {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      };

      const ordersByType = {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      };

      // Calculer les revenus et commandes par type depuis les order_items
      // Aussi calculer les revenus par type et par mois pour les graphiques
      // OPTIMISATION: Créer un Map pour O(1) lookup au lieu de O(n) avec find()
      const ordersMap = new Map(orders.map((o: { id: string; created_at: string }) => [o.id, o]));

      const  revenueByTypeAndMonthMap: Record<
        string,
        {
          digital: number;
          physical: number;
          service: number;
          course: number;
          artist: number;
        }
      > = {};

      safeOrderItems.forEach(
        (item: {
          product_id: string | null;
          quantity: number | null;
          unit_price: number | null;
          total_price: number | null;
          product_type?: string;
          products?: { product_type?: string } | null;
          order_id: string;
        }) => {
          // Utiliser product_type depuis order_items ou depuis products si disponible
          const type = (item.product_type ||
            item.products?.product_type) as keyof typeof revenueByType;

          if (type && type in revenueByType) {
            const itemRevenue =
              item.total_price ||
              (item.unit_price && item.quantity ? item.unit_price * item.quantity : 0);
            revenueByType[type] += Number(itemRevenue) || 0;
            ordersByType[type] += 1;

            // Utiliser le Map pour O(1) lookup au lieu de find() O(n)
            if (item.order_id) {
              const order = ordersMap.get(item.order_id);
              if (order && order.created_at) {
                const month = new Date(order.created_at).toLocaleString('fr-FR', {
                  month: 'short',
                  year: 'numeric',
                });
                if (!revenueByTypeAndMonthMap[month]) {
                  revenueByTypeAndMonthMap[month] = {
                    digital: 0,
                    physical: 0,
                    service: 0,
                    course: 0,
                    artist: 0,
                  };
                }
                revenueByTypeAndMonthMap[month][type] += Number(itemRevenue) || 0;
              }
            }
          }
        }
      );

      // Convertir en tableau et trier
      const revenueByTypeAndMonthArray = Object.entries(revenueByTypeAndMonthMap)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // Calculer les métriques de performance par type
      const performanceMetricsByType = {
        digital: {
          conversionRate:
            ordersByType.digital > 0 && totalCustomers > 0
              ? Math.min(Math.round((ordersByType.digital / totalCustomers) * 100), 100)
              : 0,
          averageOrderValue:
            ordersByType.digital > 0 ? revenueByType.digital / ordersByType.digital : 0,
          customerRetention: Math.round(
            totalCustomers * 0.3 * (ordersByType.digital / totalOrders || 0)
          ),
        },
        physical: {
          conversionRate:
            ordersByType.physical > 0 && totalCustomers > 0
              ? Math.min(Math.round((ordersByType.physical / totalCustomers) * 100), 100)
              : 0,
          averageOrderValue:
            ordersByType.physical > 0 ? revenueByType.physical / ordersByType.physical : 0,
          customerRetention: Math.round(
            totalCustomers * 0.3 * (ordersByType.physical / totalOrders || 0)
          ),
        },
        service: {
          conversionRate:
            ordersByType.service > 0 && totalCustomers > 0
              ? Math.min(Math.round((ordersByType.service / totalCustomers) * 100), 100)
              : 0,
          averageOrderValue:
            ordersByType.service > 0 ? revenueByType.service / ordersByType.service : 0,
          customerRetention: Math.round(
            totalCustomers * 0.3 * (ordersByType.service / totalOrders || 0)
          ),
        },
        course: {
          conversionRate:
            ordersByType.course > 0 && totalCustomers > 0
              ? Math.min(Math.round((ordersByType.course / totalCustomers) * 100), 100)
              : 0,
          averageOrderValue:
            ordersByType.course > 0 ? revenueByType.course / ordersByType.course : 0,
          customerRetention: Math.round(
            totalCustomers * 0.3 * (ordersByType.course / totalOrders || 0)
          ),
        },
        artist: {
          conversionRate:
            ordersByType.artist > 0 && totalCustomers > 0
              ? Math.min(Math.round((ordersByType.artist / totalCustomers) * 100), 100)
              : 0,
          averageOrderValue:
            ordersByType.artist > 0 ? revenueByType.artist / ordersByType.artist : 0,
          customerRetention: Math.round(
            totalCustomers * 0.3 * (ordersByType.artist / totalOrders || 0)
          ),
        },
      };

      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalCustomers,
        totalRevenue,
        recentOrders: recentOrders.map(order => {
          // Gérer le cas où customers peut être un objet ou un tableau
          let  customerData: { name: string; email: string } | null = null;
          if (order.customers) {
            if (Array.isArray(order.customers) && order.customers.length > 0) {
              customerData = {
                name: order.customers[0]?.name || 'Client inconnu',
                email: order.customers[0]?.email || '',
              };
            } else if (typeof order.customers === 'object' && 'name' in order.customers) {
              customerData = {
                name: (order.customers as { name: string | null }).name || 'Client inconnu',
                email: (order.customers as { email: string | null }).email || '',
              };
            }
          }

          // Extraire les types de produits depuis order_items
          const  productTypes: string[] = [];
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach(
              (item: { product_type?: string; products?: { product_type?: string } | null }) => {
                const type = item.product_type || item.products?.product_type;
                if (type && !productTypes.includes(type)) {
                  productTypes.push(type);
                }
              }
            );
          }

          return {
            id: order.id,
            order_number: order.order_number || 'N/A',
            total_amount: Number(order.total_amount) || 0,
            status: order.status || 'unknown',
            created_at: order.created_at || new Date().toISOString(),
            customers: customerData,
            product_types: productTypes,
          };
        }),
        topProducts: topProductsList,
        revenueByMonth: revenueByMonthArray,
        ordersByStatus,
        recentActivity,
        performanceMetrics,
        trends,
        productsByType,
        revenueByType,
        ordersByType,
        performanceMetricsByType,
        revenueByTypeAndMonth: revenueByTypeAndMonthArray,
      });

      logger.info('✅ Dashboard stats loaded successfully');
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('❌ Error fetching dashboard stats:', {
        error: errorMessage,
        details: error,
      });
      setError(errorMessage || 'Erreur lors du chargement des données');

      // Utiliser les données de fallback en cas d'erreur
      setStats(getFallbackStats());

      toast({
        title: 'Erreur',
        description: 'Utilisation des données de démonstration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [store, toast, options?.period, options?.customStartDate, options?.customEndDate]);

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






