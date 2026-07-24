import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface PlatformCommission {
  id: string;
  payment_id?: string | null;
  store_id: string;
  order_id: string | null;
  product_id?: string | null;
  commission_rate: number;
  commission_amount: number;
  total_amount?: number | null;
  seller_amount?: number | null;
  status: string;
  created_at: string;
  updated_at?: string;
  stores?: {
    name: string;
    slug?: string;
  } | null;
  orders?: {
    total_amount: number;
    payment_status?: string;
    refunded_amount?: number;
  } | null;
}

export interface CommissionStats {
  totalCommissions: number;
  totalSales: number;
  averageCommission: number;
  salesCount: number;
}

export const usePlatformCommissions = (startDate?: string, endDate?: string) => {
  const [commissions, setCommissions] = useState<PlatformCommission[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    totalSales: 0,
    averageCommission: 0,
    salesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('platform_commissions')
        .select(
          `
          *,
          stores(name, slug),
          orders(total_amount, payment_status, refunded_amount)
        `
        )
        .in('status', ['completed', 'pending', 'paid'])
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      let { data, error } = await query;

      // Fallback sans embeds si RLS/jointure bloque (évite totaux à 0 silencieux)
      if (error) {
        logger.warn('usePlatformCommissions embed query failed, falling back', { error });
        let plain = supabase
          .from('platform_commissions')
          .select('*')
          .in('status', ['completed', 'pending', 'paid'])
          .order('created_at', { ascending: false });
        if (startDate) plain = plain.gte('created_at', `${startDate}T00:00:00.000Z`);
        if (endDate) plain = plain.lte('created_at', `${endDate}T23:59:59.999Z`);
        ({ data, error } = await plain);
      }

      if (error) throw error;

      const rows = (data || []) as PlatformCommission[];
      setCommissions(rows);

      if (rows.length > 0) {
        const totalCommissions = rows.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
        const totalSales = rows.reduce((sum, c) => {
          const fromOrder = Number(c.orders?.total_amount);
          const fromRow = Number(c.total_amount);
          if (Number.isFinite(fromOrder) && fromOrder > 0) return sum + fromOrder;
          if (Number.isFinite(fromRow) && fromRow > 0) return sum + fromRow;
          const rate = Number(c.commission_rate || 0);
          if (rate > 0) return sum + Number(c.commission_amount || 0) / rate;
          return sum;
        }, 0);
        const salesCount = rows.length;
        const averageCommission = salesCount > 0 ? totalCommissions / salesCount : 0;

        setStats({
          totalCommissions,
          totalSales,
          averageCommission,
          salesCount,
        });
      } else {
        setStats({
          totalCommissions: 0,
          totalSales: 0,
          averageCommission: 0,
          salesCount: 0,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('usePlatformCommissions fetch failed', { error: err });
      toast({
        title: 'Erreur',
        description: message || 'Impossible de charger les commissions',
        variant: 'destructive',
      });
      setCommissions([]);
      setStats({
        totalCommissions: 0,
        totalSales: 0,
        averageCommission: 0,
        salesCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    void fetchCommissions();
  }, [fetchCommissions]);

  const exportToCSV = () => {
    if (commissions.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: "Il n'y a pas de commissions à exporter",
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Date',
      'Boutique',
      'Montant Total',
      'Commission',
      'Reversement Vendeur',
      'Remboursé cmd',
      'Statut paiement',
      'Statut commission',
    ];

    const csvData = commissions.map(c => {
      const totalAmount =
        Number(c.orders?.total_amount) ||
        Number(c.total_amount) ||
        (Number(c.commission_rate) > 0
          ? Number(c.commission_amount) / Number(c.commission_rate)
          : 0);
      const sellerAmount =
        Number(c.seller_amount) || Math.max(0, totalAmount - Number(c.commission_amount || 0));
      return [
        new Date(c.created_at).toLocaleDateString('fr-FR'),
        c.stores?.name || 'N/A',
        `${totalAmount} XOF`,
        `${c.commission_amount} XOF`,
        `${sellerAmount} XOF`,
        `${Number(c.orders?.refunded_amount) || 0} XOF`,
        c.orders?.payment_status || '—',
        c.status,
      ];
    });

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export réussi',
      description: 'Les données ont été exportées en CSV',
    });
  };

  return {
    commissions,
    stats,
    loading,
    refetch: fetchCommissions,
    exportToCSV,
  };
};
