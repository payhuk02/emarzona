import { supabase } from '@/integrations/supabase/client';

/** Libère un escrow au niveau commande lorsqu'il n'existe pas de ligne `payments`. */
export async function releaseOrderSecuredPayment(orderId: string): Promise<void> {
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
