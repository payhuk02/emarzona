import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "./use-store";
import { logger } from '@/lib/logger';

export interface AdvancedDashboardStats {
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
  }>;
  
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
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
}

export const useAdvancedDashboardStats = () => {
  const [stats, setStats] = useState<AdvancedDashboardStats>({
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
    recentActivity: [],
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
  });
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { store } = useStore();

  const fetchAdvancedStats = useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }

    try {
      logger.info('Fetching advanced dashboard stats for store:', store.id);

      // 1. Statistiques de base des produits
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, is_active, created_at")
        .eq("store_id", store.id);

      if (productsError) throw productsError;

      // 2. Statistiques des commandes
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .eq("store_id", store.id);

      if (ordersError) throw ordersError;

      // 3. Statistiques des clients
      const { count: customersCount, error: customersError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id);

      if (customersError) throw customersError;

      // 4. Commandes récentes avec détails clients
      const { data: recentOrders, error: recentOrdersError } = await supabase
        .from("orders")
        .select(`
          id, 
          order_number, 
          total_amount, 
          status, 
          created_at, 
          customers(name, email)
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentOrdersError) {
        logger.error('Error fetching recent orders:', recentOrdersError);
        // Continue without throwing - this is not critical
      }

      // 5. Top produits par nombre de commandes et revenus
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          product_name,
          quantity,
          price,
          order_id,
          orders!inner(store_id, total_amount)
        `)
        .eq("orders.store_id", store.id);

      if (orderItemsError) {
        logger.error('Error fetching order items:', orderItemsError);
        // Continue without throwing - this is not critical
      }

      // Calculer les statistiques des produits
      const productStats = (orderItems || []).reduce((acc: any, item: any) => {
        if (item.product_id) {
          if (!acc[item.product_id]) {
            acc[item.product_id] = {
              orderCount: 0,
              revenue: 0,
              quantity: 0
            };
          }
          acc[item.product_id].orderCount += 1;
          acc[item.product_id].revenue += parseFloat(item.price || 0);
          acc[item.product_id].quantity += parseInt(item.quantity || 0);
        }
        return acc;
      }, {});

      // Récupérer les détails des top produits
      const topProductIds = Object.entries(productStats)
        .sort(([, a]: any, [, b]: any) => b.orderCount - a.orderCount)
        .slice(0, 10)
        .map(([id]) => id);

      let topProducts: any[] = [];
      if (topProductIds.length > 0) {
        const { data: topProductsData, error: topProductsError } = await supabase
          .from("products")
          .select("id, name, price, image_url")
          .in("id", topProductIds);

        if (topProductsError) {
          logger.error('Error fetching top products:', topProductsError);
          // Continue without throwing - this is not critical
        } else {
          topProducts = (topProductsData || []).map((product: any) => ({
            ...product,
            orderCount: productStats[product.id]?.orderCount || 0,
            revenue: productStats[product.id]?.revenue || 0,
          }));
        }
      }

      // 6. Revenus par mois (derniers 12 mois)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: ordersForRevenue, error: revenueError } = await supabase
        .from("orders")
        .select("total_amount, created_at, customers(id)")
        .eq("store_id", store.id)
        .gte("created_at", twelveMonthsAgo.toISOString());

      if (revenueError) {
        logger.error('Error fetching revenue data:', revenueError);
        // Continue without throwing - this is not critical
      }

      // Calculer les revenus par mois
      const revenueByMonth = (ordersForRevenue || []).reduce((acc: any, order: any) => {
        const date = new Date(order.created_at);
        const monthKey = date.toLocaleString("fr-FR", { month: "short", year: "numeric" });
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            revenue: 0,
            orders: 0,
            customers: new Set()
          };
        }
        
        acc[monthKey].revenue += parseFloat(order.total_amount);
        acc[monthKey].orders += 1;
        if (order.customers?.id) {
          acc[monthKey].customers.add(order.customers.id);
        }
        
        return acc;
      }, {});

      const revenueByMonthArray = Object.entries(revenueByMonth)
        .map(([month, data]: [string, any]) => ({
          month,
          revenue: data.revenue,
          orders: data.orders,
          customers: data.customers.size
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // 7. Répartition des commandes par statut
      const statusCounts = (orders || []).reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const totalOrdersCount = orders?.length || 0;
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0
      }));

      // 8. Activité récente (simulation basée sur les données existantes)
      const recentActivity = [
        ...(recentOrders || []).slice(0, 5).map((order: any) => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          message: `Nouvelle commande #${order.order_number} de ${order.total_amount} FCFA`,
          timestamp: order.created_at,
          status: order.status
        })),
        ...(topProducts || []).slice(0, 3).map((product: any) => ({
          id: `product-${product.id}`,
          type: 'product' as const,
          message: `Produit "${product.name}" vendu ${product.orderCount} fois`,
          timestamp: new Date().toISOString(),
          status: 'success'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10);

      // 9. Métriques de performance (calculées)
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
      
      // Simulation de métriques avancées (dans un vrai projet, ces données viendraient d'analytics)
      const performanceMetrics = {
        conversionRate: Math.min(15 + Math.random() * 10, 25), // 15-25%
        averageOrderValue,
        customerRetention: Math.min(60 + Math.random() * 20, 80), // 60-80%
        pageViews: Math.floor(1000 + Math.random() * 5000), // 1000-6000
        bounceRate: Math.max(20 - Math.random() * 10, 10), // 10-20%
        sessionDuration: Math.floor(180 + Math.random() * 300), // 3-8 minutes
      };

      // 10. Calcul des tendances (comparaison avec le mois précédent)
      const currentMonth = new Date().toLocaleString("fr-FR", { month: "short", year: "numeric" });
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthKey = lastMonth.toLocaleString("fr-FR", { month: "short", year: "numeric" });

      const currentMonthData = revenueByMonthArray.find(item => item.month === currentMonth);
      const lastMonthData = revenueByMonthArray.find(item => item.month === lastMonthKey);

      const trends = {
        revenueGrowth: lastMonthData ? 
          Math.round(((currentMonthData?.revenue || 0) - lastMonthData.revenue) / lastMonthData.revenue * 100) : 0,
        orderGrowth: lastMonthData ? 
          Math.round(((currentMonthData?.orders || 0) - lastMonthData.orders) / lastMonthData.orders * 100) : 0,
        customerGrowth: lastMonthData ? 
          Math.round(((currentMonthData?.customers || 0) - lastMonthData.customers) / lastMonthData.customers * 100) : 0,
        productGrowth: Math.round(Math.random() * 20 - 10), // Simulation
      };

      setStats({
        totalProducts: products?.length || 0,
        activeProducts: products?.filter((p) => p.is_active).length || 0,
        totalOrders: totalOrdersCount,
        pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
        completedOrders: orders?.filter((o) => o.status === "completed").length || 0,
        cancelledOrders: orders?.filter((o) => o.status === "cancelled").length || 0,
        totalCustomers: customersCount || 0,
        totalRevenue,
        recentOrders: recentOrders || [],
        topProducts,
        revenueByMonth: revenueByMonthArray,
        ordersByStatus,
        recentActivity,
        performanceMetrics,
        trends,
      });

      logger.info('Advanced dashboard stats loaded successfully');

    } catch (error: any) {
      logger.error('Error fetching advanced dashboard stats:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [store?.id, toast]);

  useEffect(() => {
    fetchAdvancedStats();
  }, [fetchAdvancedStats]);

  return { 
    stats, 
    loading, 
    refetch: fetchAdvancedStats 
  };
};
