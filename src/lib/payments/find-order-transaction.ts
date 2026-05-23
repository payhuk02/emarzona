/**
 * Trouve la transaction complétée à rembourser pour une commande
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface OrderTransactionForRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
}

export async function findCompletedTransactionForOrder(
  orderId: string
): Promise<OrderTransactionForRefund | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, currency, status, payment_provider')
    .eq('order_id', orderId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('findCompletedTransactionForOrder failed', { error, orderId });
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    amount: Number(data.amount ?? 0),
    currency: data.currency ?? 'XOF',
    status: data.status ?? 'completed',
    payment_provider: data.payment_provider,
  };
}
