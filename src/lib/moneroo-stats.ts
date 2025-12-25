/**
 * Service de statistiques avancées pour Moneroo
 * Fournit des statistiques détaillées sur les paiements Moneroo
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from './logger';
import { Currency } from './currency-converter';
import { monerooStatsCache, generateStatsCacheKey } from './moneroo-cache';

export interface PaymentStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  cancelled: number;
  refunded: number;
  successRate: number;
  failureRate: number;
}

export interface RevenueStats {
  total: number;
  successful: number;
  refunded: number;
  net: number;
  currency: Currency;
  byCurrency: Record<Currency, number>;
}

export interface TimeStats {
  averageProcessingTime: number; // en minutes
  fastestPayment: number; // en minutes
  slowestPayment: number; // en minutes
  medianProcessingTime: number; // en minutes
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  totalAmount: number;
  successRate: number;
}

export interface MonerooStats {
  payments: PaymentStats;
  revenue: RevenueStats;
  time: TimeStats;
  byMethod: PaymentMethodStats[];
  byDate: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Récupère les statistiques de paiement
 */
export async function getPaymentStats(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<PaymentStats> {
  const cacheKey = generateStatsCacheKey('payments', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('status')
        .eq('payment_provider', 'moneroo');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching payment stats: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        cancelled: 0,
        refunded: 0,
        successRate: 0,
        failureRate: 0,
      };
    }

    const stats = {
      total: transactions.length,
      successful: transactions.filter(t => t.status === 'completed').length,
      failed: transactions.filter(t => t.status === 'failed').length,
      pending: transactions.filter(t => ['pending', 'processing'].includes(t.status)).length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      refunded: transactions.filter(t => t.status === 'refunded').length,
      successRate: 0,
      failureRate: 0,
    };

    const finalized = stats.successful + stats.failed;
    if (finalized > 0) {
      stats.successRate = (stats.successful / finalized) * 100;
      stats.failureRate = (stats.failed / finalized) * 100;
    }

      return stats;
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw error;
    }
  });
}

/**
 * Récupère les statistiques de revenus
 */
export async function getRevenueStats(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<RevenueStats> {
  const cacheKey = generateStatsCacheKey('revenue', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('amount, currency, status')
        .eq('payment_provider', 'moneroo')
        .in('status', ['completed', 'refunded']);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching revenue stats: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        successful: 0,
        refunded: 0,
        net: 0,
        currency: 'XOF',
        byCurrency: {} as Record<Currency, number>,
      };
    }

    let total = 0;
    let successful = 0;
    let refunded = 0;
    const byCurrency: Record<string, number> = {};

    for (const transaction of transactions) {
      const amount = parseFloat(transaction.amount.toString());
      const currency = (transaction.currency || 'XOF') as Currency;

      total += amount;

      if (transaction.status === 'completed') {
        successful += amount;
      } else if (transaction.status === 'refunded') {
        refunded += amount;
      }

      byCurrency[currency] = (byCurrency[currency] || 0) + amount;
    }

      return {
        total,
        successful,
        refunded,
        net: successful - refunded,
        currency: 'XOF', // Devise de base
        byCurrency: byCurrency as Record<Currency, number>,
      };
    } catch (error) {
      logger.error('Error getting revenue stats:', error);
      throw error;
    }
  });
}

/**
 * Récupère les statistiques de temps de traitement
 */
export async function getTimeStats(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<TimeStats> {
  const cacheKey = generateStatsCacheKey('time', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('created_at, completed_at, failed_at')
        .eq('payment_provider', 'moneroo')
        .in('status', ['completed', 'failed'])
        .not('completed_at', 'is', null);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching time stats: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return {
        averageProcessingTime: 0,
        fastestPayment: 0,
        slowestPayment: 0,
        medianProcessingTime: 0,
      };
    }

    const processingTimes: number[] = [];

    for (const transaction of transactions) {
      const startTime = new Date(transaction.created_at).getTime();
      const endTime = transaction.completed_at
        ? new Date(transaction.completed_at).getTime()
        : transaction.failed_at
        ? new Date(transaction.failed_at).getTime()
        : null;

      if (endTime) {
        const duration = (endTime - startTime) / (1000 * 60); // en minutes
        processingTimes.push(duration);
      }
    }

    if (processingTimes.length === 0) {
      return {
        averageProcessingTime: 0,
        fastestPayment: 0,
        slowestPayment: 0,
        medianProcessingTime: 0,
      };
    }

    processingTimes.sort((a, b) => a - b);

    const average = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const fastest = processingTimes[0];
    const slowest = processingTimes[processingTimes.length - 1];
    const median = processingTimes[Math.floor(processingTimes.length / 2)];

      return {
        averageProcessingTime: Math.round(average * 100) / 100,
        fastestPayment: Math.round(fastest * 100) / 100,
        slowestPayment: Math.round(slowest * 100) / 100,
        medianProcessingTime: Math.round(median * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting time stats:', error);
      throw error;
    }
  });
}

/**
 * Récupère les statistiques par méthode de paiement
 */
export async function getPaymentMethodStats(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<PaymentMethodStats[]> {
  const cacheKey = generateStatsCacheKey('methods', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('moneroo_payment_method, status, amount')
        .eq('payment_provider', 'moneroo')
        .not('moneroo_payment_method', 'is', null);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching payment method stats: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    const methodStats: Record<string, {
      count: number;
      successful: number;
      totalAmount: number;
    }> = {};

    for (const transaction of transactions) {
      const method = transaction.moneroo_payment_method || 'unknown';
      const amount = parseFloat(transaction.amount.toString());

      if (!methodStats[method]) {
        methodStats[method] = {
          count: 0,
          successful: 0,
          totalAmount: 0,
        };
      }

      methodStats[method].count++;
      methodStats[method].totalAmount += amount;

      if (transaction.status === 'completed') {
        methodStats[method].successful++;
      }
    }

      return Object.entries(methodStats).map(([method, stats]) => ({
        method,
        count: stats.count,
        totalAmount: stats.totalAmount,
        successRate: stats.count > 0 ? (stats.successful / stats.count) * 100 : 0,
      }));
    } catch (error) {
      logger.error('Error getting payment method stats:', error);
      throw error;
    }
  });
}

/**
 * Récupère les statistiques par date
 */
export async function getStatsByDate(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<Array<{ date: string; count: number; amount: number }>> {
  const cacheKey = generateStatsCacheKey('byDate', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('created_at, amount, status')
        .eq('payment_provider', 'moneroo')
        .eq('status', 'completed');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching stats by date: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    const statsByDate: Record<string, { count: number; amount: number }> = {};

    for (const transaction of transactions) {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      const amount = parseFloat(transaction.amount.toString());

      if (!statsByDate[date]) {
        statsByDate[date] = { count: 0, amount: 0 };
      }

      statsByDate[date].count++;
      statsByDate[date].amount += amount;
    }

    return Object.entries(statsByDate)
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        amount: stats.amount,
      }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.error('Error getting stats by date:', error);
      throw error;
    }
  });
}

/**
 * Récupère toutes les statistiques Moneroo
 */
export async function getAllMonerooStats(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<MonerooStats> {
  const cacheKey = generateStatsCacheKey('all', startDate, endDate, storeId);
  
  return monerooStatsCache.getOrSet(cacheKey, async () => {
    try {
      const [payments, revenue, time, byMethod, byDate] = await Promise.all([
        getPaymentStats(startDate, endDate, storeId),
        getRevenueStats(startDate, endDate, storeId),
        getTimeStats(startDate, endDate, storeId),
        getPaymentMethodStats(startDate, endDate, storeId),
        getStatsByDate(startDate, endDate, storeId),
      ]);

      return {
        payments,
        revenue,
        time,
        byMethod,
        byDate,
        period: {
          startDate: startDate?.toISOString() || new Date(0).toISOString(),
          endDate: endDate?.toISOString() || new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error getting all Moneroo stats:', error);
      throw error;
    }
  });
}







