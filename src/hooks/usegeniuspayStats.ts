/**
 * Hook React pour récupérer les statistiques GeniusPay
 */

import { useQuery } from '@tanstack/react-query';
import {
  getAllGeniusPayStats,
  getPaymentStats,
  getRevenueStats,
  getTimeStats,
  getPaymentMethodStats,
  getStatsByDate,
  type GeniusPayStats,
  type PaymentStats,
  type RevenueStats,
  type TimeStats,
  type PaymentMethodStats,
} from '@/lib/geniuspay-stats';

export interface UseGeniusPayStatsOptions {
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  enabled?: boolean;
}

/**
 * Hook pour récupérer toutes les statistiques GeniusPay
 */
export function useGeniusPayStats(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<GeniusPayStats>({
    queryKey: ['geniuspay-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getAllGeniusPayStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de paiement
 */
export function usePaymentStats(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<PaymentStats>({
    queryKey: ['geniuspay-payment-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getPaymentStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de revenus
 */
export function useRevenueStats(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<RevenueStats>({
    queryKey: ['geniuspay-revenue-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getRevenueStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de temps
 */
export function useTimeStats(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<TimeStats>({
    queryKey: ['geniuspay-time-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getTimeStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques par méthode de paiement
 */
export function usePaymentMethodStats(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<PaymentMethodStats[]>({
    queryKey: ['geniuspay-method-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getPaymentMethodStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques par date
 */
export function useStatsByDate(options: UseGeniusPayStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<Array<{ date: string; count: number; amount: number }>>({
    queryKey: ['geniuspay-stats-by-date', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getStatsByDate(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}













