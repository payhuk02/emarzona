import { supabase } from '@/integrations/supabase/client';
import {
  approveServiceProjectDelivery,
  fetchServiceOrderMilestones,
  orderHasProjectMilestones,
} from '@/lib/payments/service-order-milestone-flow';

/** Libère un escrow au niveau commande lorsqu'il n'existe pas de ligne `payments`. */
export async function releaseOrderSecuredPayment(orderId: string): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('metadata')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) throw orderError;

  const metadata =
    order?.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};

  let hasMilestones = orderHasProjectMilestones(metadata);
  if (!hasMilestones) {
    try {
      const rows = await fetchServiceOrderMilestones(orderId);
      hasMilestones = rows.length > 0;
    } catch {
      hasMilestones = false;
    }
  }

  if (hasMilestones) {
    await approveServiceProjectDelivery(orderId);
    return;
  }

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'completed',
      delivery_status: 'confirmed',
      remaining_amount: 0,
    })
    .eq('id', orderId);

  if (error) throw error;
}
