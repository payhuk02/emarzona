import { supabase } from '@/integrations/supabase/client';

export type ServiceOrderMilestoneStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'held'
  | 'released'
  | 'paid'
  | 'cancelled';

export type ServiceOrderMilestoneRow = {
  id: string;
  order_id: string;
  sort_order: number;
  label: string;
  percentage: number;
  amount: number;
  trigger_type: 'order_placed' | 'delivery_approved' | 'manual';
  status: ServiceOrderMilestoneStatus;
  paid_at: string | null;
  released_at: string | null;
};

export function orderHasProjectMilestones(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  return metadata?.project_milestones_enabled === true;
}

export async function fetchServiceOrderMilestones(
  orderId: string
): Promise<ServiceOrderMilestoneRow[]> {
  const { data, error } = await supabase
    .from('service_order_milestones' as never)
    .select(
      'id, order_id, sort_order, label, percentage, amount, trigger_type, status, paid_at, released_at'
    )
    .eq('order_id' as never, orderId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServiceOrderMilestoneRow[];
}

export async function activateServiceOrderCheckoutMilestones(orderId: string): Promise<void> {
  const { error } = await supabase.rpc(
    // @ts-expect-error RPC ajouté en migration service_project_payment_milestones
    'activate_service_order_checkout_milestones',
    { p_order_id: orderId }
  );
  if (error) throw error;
}

export async function approveServiceProjectDelivery(orderId: string): Promise<{
  remaining_amount: number;
}> {
  const { data, error } = await supabase.rpc(
    // @ts-expect-error RPC ajouté en migration service_project_payment_milestones
    'approve_service_project_delivery',
    { p_order_id: orderId }
  );
  if (error) throw error;
  const payload = (data ?? {}) as { remaining_amount?: number };
  return { remaining_amount: Number(payload.remaining_amount) || 0 };
}

export async function completeServiceMilestoneBalancePayment(orderId: string): Promise<void> {
  const { error } = await supabase.rpc(
    // @ts-expect-error RPC ajouté en migration service_project_payment_milestones
    'complete_service_milestone_balance_payment',
    { p_order_id: orderId }
  );
  if (error) throw error;
}
