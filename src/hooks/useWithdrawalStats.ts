/**
 * Hook: useWithdrawalStats
 * Description: Statistiques avancées sur les retraits
 * Date: 2025-02-03
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  WithdrawalAdvancedStats, 
  WithdrawalPeriodStats, 
  WithdrawalTimeStats 
} from '@/types/store-withdrawals';
import { logger } from '@/lib/logger';

interface UseWithdrawalStatsOptions {
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export const useWithdrawalStats = (options: UseWithdrawalStatsOptions = {}) => {
  const { storeId, startDate, endDate } = options;
  const [stats, setStats] = useState<WithdrawalAdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Récupérer tous les retraits
      let query = supabase
        .from('store_withdrawals')
        .select('id, amount, status, payment_method, created_at, processed_at, approved_at');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: withdrawals, error } = await query;

      if (error) throw error;

      if (!withdrawals || withdrawals.length === 0) {
        setStats({
          total_withdrawals: 0,
          total_amount: 0,
          success_rate: 0,
          average_amount: 0,
          time_stats: {
            average_processing_time_hours: 0,
            average_completion_time_hours: 0,
            fastest_processing_hours: 0,
            slowest_processing_hours: 0,
          },
          period_stats: [],
          by_payment_method: {
            mobile_money: { count: 0, amount: 0, success_rate: 0 },
            bank_card: { count: 0, amount: 0, success_rate: 0 },
            bank_transfer: { count: 0, amount: 0, success_rate: 0 },
          },
        });
        return;
      }

      // Calculer les statistiques de base
      const total_withdrawals = withdrawals.length;
      const total_amount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0);
      const completed = withdrawals.filter((w) => w.status === 'completed');
      const completed_count = completed.length;
      const success_rate = total_withdrawals > 0 ? (completed_count / total_withdrawals) * 100 : 0;
      const average_amount = total_withdrawals > 0 ? total_amount / total_withdrawals : 0;

      // Calculer les statistiques de temps
      const processingTimes: number[] = [];
      const completionTimes: number[] = [];

      withdrawals.forEach((w) => {
        if (w.approved_at && w.processed_at) {
          const approved = new Date(w.approved_at).getTime();
          const processed = new Date(w.processed_at).getTime();
          const processingTime = (processed - approved) / (1000 * 60 * 60); // heures
          processingTimes.push(processingTime);
        }

        if (w.created_at && w.processed_at && w.status === 'completed') {
          const created = new Date(w.created_at).getTime();
          const processed = new Date(w.processed_at).getTime();
          const completionTime = (processed - created) / (1000 * 60 * 60); // heures
          completionTimes.push(completionTime);
        }
      });

      const time_stats: WithdrawalTimeStats = {
        average_processing_time_hours: processingTimes.length > 0
          ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
          : 0,
        average_completion_time_hours: completionTimes.length > 0
          ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
          : 0,
        fastest_processing_hours: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
        slowest_processing_hours: processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
      };

      // Calculer les statistiques par période (mensuel)
      const periodMap = new Map<string, {
        total_count: number;
        total_amount: number;
        completed_count: number;
        completed_amount: number;
        failed_count: number;
        failed_amount: number;
      }>();

      withdrawals.forEach((w) => {
        const date = new Date(w.created_at);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!periodMap.has(period)) {
          periodMap.set(period, {
            total_count: 0,
            total_amount: 0,
            completed_count: 0,
            completed_amount: 0,
            failed_count: 0,
            failed_amount: 0,
          });
        }

        const periodData = periodMap.get(period)!;
        periodData.total_count++;
        periodData.total_amount += parseFloat(w.amount.toString());

        if (w.status === 'completed') {
          periodData.completed_count++;
          periodData.completed_amount += parseFloat(w.amount.toString());
        } else if (w.status === 'failed') {
          periodData.failed_count++;
          periodData.failed_amount += parseFloat(w.amount.toString());
        }
      });

      const period_stats: WithdrawalPeriodStats[] = Array.from(periodMap.entries())
        .map(([period, data]) => ({
          period,
          ...data,
          success_rate: data.total_count > 0 ? (data.completed_count / data.total_count) * 100 : 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      // Calculer les statistiques par méthode de paiement
      const byMethod = {
        mobile_money: { count: 0, amount: 0, completed: 0 },
        bank_card: { count: 0, amount: 0, completed: 0 },
        bank_transfer: { count: 0, amount: 0, completed: 0 },
      };

      withdrawals.forEach((w) => {
        const method = w.payment_method as keyof typeof byMethod;
        if (byMethod[method]) {
          byMethod[method].count++;
          byMethod[method].amount += parseFloat(w.amount.toString());
          if (w.status === 'completed') {
            byMethod[method].completed++;
          }
        }
      });

      const by_payment_method = {
        mobile_money: {
          count: byMethod.mobile_money.count,
          amount: byMethod.mobile_money.amount,
          success_rate: byMethod.mobile_money.count > 0
            ? (byMethod.mobile_money.completed / byMethod.mobile_money.count) * 100
            : 0,
        },
        bank_card: {
          count: byMethod.bank_card.count,
          amount: byMethod.bank_card.amount,
          success_rate: byMethod.bank_card.count > 0
            ? (byMethod.bank_card.completed / byMethod.bank_card.count) * 100
            : 0,
        },
        bank_transfer: {
          count: byMethod.bank_transfer.count,
          amount: byMethod.bank_transfer.amount,
          success_rate: byMethod.bank_transfer.count > 0
            ? (byMethod.bank_transfer.completed / byMethod.bank_transfer.count) * 100
            : 0,
        },
      };

      setStats({
        total_withdrawals,
        total_amount,
        success_rate,
        average_amount,
        time_stats,
        period_stats,
        by_payment_method,
      });
    } catch (error: any) {
      logger.error('Error fetching withdrawal stats', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, startDate, endDate, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};

