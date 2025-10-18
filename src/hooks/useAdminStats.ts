import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  totalReferrals: number;
  activeUsers: number;
  recentUsers: Array<{
    id: string;
    email: string;
    display_name: string | null;
    created_at: string;
  }>;
  topStores: Array<{
    id: string;
    name: string;
    total_sales: number;
  }>;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    totalReferrals: 0,
    activeUsers: 0,
    recentUsers: [],
    topStores: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Récupérer le nombre total d'utilisateurs
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Récupérer le nombre de stores
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      // Récupérer le nombre de produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Récupérer le nombre de commandes
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Récupérer le revenu total
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Récupérer les commissions totales
      const { data: commissionsData } = await supabase
        .from('platform_commissions')
        .select('commission_amount')
        .eq('status', 'completed');

      const totalCommissions = commissionsData?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      // Récupérer le nombre de parrainages
      const { count: referralsCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

      // Récupérer les utilisateurs récents
      const { data: recentUsersData } = await supabase
        .from('profiles')
        .select('user_id, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentUsers = (recentUsersData || []).map(profile => ({
        id: profile.user_id,
        email: 'Utilisateur',
        display_name: profile.display_name,
        created_at: profile.created_at,
      }));

      // Récupérer les top stores
      const { data: topStoresData } = await supabase
        .from('stores')
        .select('id, name')
        .limit(5);

      const topStores = await Promise.all(
        (topStoresData || []).map(async (store) => {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('store_id', store.id)
            .eq('status', 'completed');

          const total_sales = ordersData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

          return {
            id: store.id,
            name: store.name,
            total_sales,
          };
        })
      );

      topStores.sort((a, b) => b.total_sales - a.total_sales);

      setStats({
        totalUsers: usersCount || 0,
        totalStores: storesCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        totalCommissions,
        totalReferrals: referralsCount || 0,
        activeUsers: usersCount || 0,
        recentUsers: recentUsers.slice(0, 5),
        topStores: topStores.slice(0, 5),
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
  }, []);

  return { stats, loading, refetch: fetchStats };
};
