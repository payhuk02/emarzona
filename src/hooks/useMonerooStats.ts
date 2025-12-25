/**
 * Hook React pour récupérer les statistiques Moneroo
 */

import { useQuery } from '@tanstack/react-query';
import {
  getAllMonerooStats,
  getPaymentStats,
  getRevenueStats,
  getTimeStats,
  getPaymentMethodStats,
  getStatsByDate,
  type MonerooStats,
  type PaymentStats,
  type RevenueStats,
  type TimeStats,
  type PaymentMethodStats,
} from '@/lib/moneroo-stats';

export interface UseMonerooStatsOptions {
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  enabled?: boolean;
}

/**
 * Hook pour récupérer toutes les statistiques Moneroo
 */
export function useMonerooStats(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<MonerooStats>({
    queryKey: ['moneroo-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getAllMonerooStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de paiement
 */
export function usePaymentStats(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<PaymentStats>({
    queryKey: ['moneroo-payment-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getPaymentStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de revenus
 */
export function useRevenueStats(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<RevenueStats>({
    queryKey: ['moneroo-revenue-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getRevenueStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques de temps
 */
export function useTimeStats(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<TimeStats>({
    queryKey: ['moneroo-time-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getTimeStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques par méthode de paiement
 */
export function usePaymentMethodStats(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<PaymentMethodStats[]>({
    queryKey: ['moneroo-method-stats', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getPaymentMethodStats(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour récupérer les statistiques par date
 */
export function useStatsByDate(options: UseMonerooStatsOptions = {}) {
  const { startDate, endDate, storeId, enabled = true } = options;

  return useQuery<Array<{ date: string; count: number; amount: number }>>({
    queryKey: ['moneroo-stats-by-date', startDate?.toISOString(), endDate?.toISOString(), storeId],
    queryFn: () => getStatsByDate(startDate, endDate, storeId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}







