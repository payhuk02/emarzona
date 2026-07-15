import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  totalReferrals: number;
  platformMrr: number;
  activeSubscriptions: number;
  activeUsers: number;
  pendingOrders: number;
  openDisputes: number;
  activeDomains: number;
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

type RpcFunction = (
  fn: string,
  params: Record<string, unknown>
) => Promise<{
  data: unknown;
  error: { message?: string } | null;
}>;

const rpc = supabase.rpc.bind(supabase) as unknown as RpcFunction;

async function fetchTopStoresByEarnings(): Promise<AdminStats['topStores']> {
  const { data: earningsRows, error } = await supabase
    .from('store_earnings')
    .select('store_id, total_revenue');

  if (error) {
    logger.warn('store_earnings top stores fallback', { error });
    return fetchTopStoresByOrders();
  }

  const totals = new Map<string, { name: string; total: number }>();
  for (const row of earningsRows ?? []) {
    const storeId = row.store_id as string;
    const current = totals.get(storeId) ?? { name: 'Boutique', total: 0 };
    current.total += Number(row.total_revenue) || 0;
    totals.set(storeId, current);
  }

  if (totals.size === 0) {
    return fetchTopStoresByOrders();
  }

  const topStoreIdsAndTotals = [...totals.entries()]
    .map(([id, v]) => ({ id, name: v.name, total_sales: v.total }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 5);

  const topIds = topStoreIdsAndTotals.map(s => s.id);
  
  if (topIds.length > 0) {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', topIds);
      
    if (stores) {
      const storeNameMap = new Map(stores.map(s => [s.id, s.name]));
      for (const item of topStoreIdsAndTotals) {
        item.name = storeNameMap.get(item.id) || 'Boutique';
      }
    }
  }

  return topStoreIdsAndTotals;
}

async function fetchTopStoresByOrders(): Promise<AdminStats['topStores']> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('store_id, total_amount')
    .in('payment_status', ['paid', 'completed'])
    .limit(5000);

  if (error) {
    logger.error('top stores orders aggregation failed', { error });
    return [];
  }

  const totals = new Map<string, { name: string; total: number }>();
  for (const row of orders ?? []) {
    const storeId = row.store_id as string;
    if (!storeId) continue;
    const current = totals.get(storeId) ?? { name: 'Boutique', total: 0 };
    current.total += Number(row.total_amount) || 0;
    totals.set(storeId, current);
  }

  const topStoreIdsAndTotals = [...totals.entries()]
    .map(([id, v]) => ({ id, name: v.name, total_sales: v.total }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 5);

  const topIds = topStoreIdsAndTotals.map(s => s.id);
  
  if (topIds.length > 0) {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', topIds);
      
    if (stores) {
      const storeNameMap = new Map(stores.map(s => [s.id, s.name]));
      for (const item of topStoreIdsAndTotals) {
        item.name = storeNameMap.get(item.id) || 'Boutique';
      }
    }
  }

  return topStoreIdsAndTotals;
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
    platformMrr: 0,
    activeSubscriptions: 0,
    activeUsers: 0,
    pendingOrders: 0,
    openDisputes: 0,
    activeDomains: 0,
    recentUsers: [],
    topStores: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      const [
        usersRes,
        storesRes,
        productsRes,
        ordersRes,
        paymentsRes,
        commissionsRes,
        subsRes,
        referralsRes,
        recentProfilesRes,
        pendingOrdersRes,
        openDisputesRes,
        domainsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').in('status', ['completed', 'succeeded', 'paid', 'successful']),
        supabase.from('platform_commissions').select('commission_amount').in('status', ['completed', 'paid', 'successful']),
        supabase.from('store_platform_subscriptions').select('mrr_amount, status'),
        supabase.from('referrals').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('user_id, display_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'pending'),
        supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase
          .from('custom_domains')
          .select('id', { count: 'exact', head: true })
          .in('status', ['active', 'verified']),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalCommissions =
        commissionsRes.data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      const activeSubs =
        subsRes.data?.filter(s => s.status === 'active' || s.status === 'trialing') ?? [];
      const platformMrr = activeSubs.reduce((sum, s) => sum + Number(s.mrr_amount || 0), 0);

      const recentProfiles = recentProfilesRes.data ?? [];
      const userIds = recentProfiles.map(p => p.user_id);
      const emailMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: emailsData } = await rpc('get_users_emails', { p_user_ids: userIds });
        if (Array.isArray(emailsData)) {
          for (const item of emailsData as { user_id: string; email: string }[]) {
            if (item.user_id) emailMap.set(item.user_id, item.email);
          }
        }
      }

      const recentUsers = recentProfiles.map(profile => ({
        id: profile.user_id,
        email: emailMap.get(profile.user_id) || 'Utilisateur',
        display_name: profile.display_name,
        created_at: profile.created_at,
      }));

      const topStores = await fetchTopStoresByEarnings();

      setStats({
        totalUsers: usersRes.count || 0,
        totalStores: storesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        totalCommissions,
        totalReferrals: referralsRes.count || 0,
        platformMrr,
        activeSubscriptions: activeSubs.length,
        activeUsers: usersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        openDisputes: openDisputesRes.error ? 0 : openDisputesRes.count || 0,
        activeDomains: domainsRes.error ? 0 : domainsRes.count || 0,
        recentUsers,
        topStores,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('useAdminStats failed', { err });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
};
