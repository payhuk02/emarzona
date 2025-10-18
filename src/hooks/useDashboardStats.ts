import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "./use-store";

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    customers: { name: string } | null;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    orderCount: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { store } = useStore();

  const fetchStats = async () => {
    if (!store) {
      setLoading(false);
      return;
    }

    try {
      // Fetch products stats
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, is_active")
        .eq("store_id", store.id);

      if (productsError) throw productsError;

      // Fetch orders stats
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, total_amount")
        .eq("store_id", store.id);

      if (ordersError) throw ordersError;

      // Fetch customers count
      const { count: customersCount, error: customersError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id);

      if (customersError) throw customersError;

      // Fetch recent orders
      const { data: recentOrders, error: recentOrdersError } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at, customers(name)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      // Fetch top products (by order items count)
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          product_name,
          order_id,
          orders!inner(store_id)
        `)
        .eq("orders.store_id", store.id);

      if (orderItemsError) throw orderItemsError;

      // Group products by count
      const productCounts = orderItems.reduce((acc: any, item: any) => {
        if (item.product_id) {
          acc[item.product_id] = (acc[item.product_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Get top 5 products
      const topProductIds = Object.entries(productCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      let topProducts: any[] = [];
      if (topProductIds.length > 0) {
        const { data: topProductsData, error: topProductsError } = await supabase
          .from("products")
          .select("id, name, price, image_url")
          .in("id", topProductIds);

        if (topProductsError) throw topProductsError;

        topProducts = (topProductsData || []).map((product: any) => ({
          ...product,
          orderCount: productCounts[product.id] || 0,
        }));
      }

      // Calculate revenue by month (last 6 months)
      const { data: ordersForRevenue, error: revenueError } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("store_id", store.id)
        .gte("created_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (revenueError) throw revenueError;

      const revenueByMonth = (ordersForRevenue || []).reduce((acc: any, order: any) => {
        const month = new Date(order.created_at).toLocaleString("fr-FR", { month: "short", year: "numeric" });
        acc[month] = (acc[month] || 0) + parseFloat(order.total_amount);
        return acc;
      }, {});

      setStats({
        totalProducts: products?.length || 0,
        activeProducts: products?.filter((p) => p.is_active).length || 0,
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
        totalCustomers: customersCount || 0,
        totalRevenue: orders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0,
        recentOrders: recentOrders || [],
        topProducts,
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue: revenue as number,
        })),
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [store?.id]);

  return { stats, loading, refetch: fetchStats };
};
