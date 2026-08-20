import { supabase } from '@/integrations/supabase/client';

export type MoneyFusionOrphanRow = {
  id: string;
  mf_token: string;
  mapped_status: string;
  verified_statut: string | null;
  verified_amount: number | null;
  currency: string;
  transaction_id_hint: string | null;
  order_id_hint: string | null;
  store_id_hint: string | null;
  customer_email_hint: string | null;
  resolution_status: string;
  linked_transaction_id: string | null;
  linked_order_id: string | null;
  resolution_note: string | null;
  webhook_attempts: number;
  last_seen_at: string;
  created_at: string;
  order_number: string | null;
  order_payment_status: string | null;
  order_paid_at: string | null;
};

export type PaymentRepairActivityRow = {
  id: string;
  transaction_id: string;
  event_type: string;
  status: string | null;
  created_at: string;
  response_data: Record<string, unknown> | null;
  order_id: string | null;
  order_number: string | null;
  order_paid_at: string | null;
  order_payment_status: string | null;
  payment_provider: string | null;
  mf_token: string | null;
};

export async function fetchMoneyFusionOrphanPayments(
  status: 'open' | 'all' = 'open'
): Promise<MoneyFusionOrphanRow[]> {
  const { data, error } = await supabase.rpc('list_moneyfusion_orphan_payments', {
    p_status: status,
    p_limit: 80,
  });
  if (error) throw error;
  return (data ?? []) as MoneyFusionOrphanRow[];
}

export async function fetchPaymentRepairActivity(): Promise<PaymentRepairActivityRow[]> {
  const { data, error } = await supabase.rpc('list_payment_repair_activity', {
    p_limit: 80,
  });
  if (error) throw error;
  return (data ?? []) as PaymentRepairActivityRow[];
}

export async function resolveMoneyFusionOrphan(orphanId: string): Promise<{
  success: boolean;
  error?: string;
  transactionId?: string;
  orderId?: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('moneyfusion-ops', {
    body: {
      action: 'resolve_orphan',
      data: { orphanId },
    },
  });
  if (error) throw new Error(error.message);
  return (data ?? { success: false, error: 'empty_response' }) as {
    success: boolean;
    error?: string;
    transactionId?: string;
    orderId?: string | null;
  };
}

export async function ignoreMoneyFusionOrphan(orphanId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('moneyfusion-ops', {
    body: {
      action: 'ignore_orphan',
      data: { orphanId },
    },
  });
  if (error) throw new Error(error.message);
  return (data ?? { success: false, error: 'empty_response' }) as {
    success: boolean;
    error?: string;
  };
}
