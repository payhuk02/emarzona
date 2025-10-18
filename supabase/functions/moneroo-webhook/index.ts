import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Moneroo webhook received:', payload);

    // Extract transaction data from Moneroo webhook
    const { transaction_id, status, amount, currency, metadata } = payload;

    if (!transaction_id) {
      throw new Error('Missing transaction_id in webhook payload');
    }

    // Find transaction by Moneroo transaction ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('moneroo_transaction_id', transaction_id)
      .single();

    if (findError) {
      console.error('Transaction not found:', findError);
      throw new Error('Transaction not found');
    }

    // Map Moneroo status to our status
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'pending': 'processing',
      'cancelled': 'cancelled',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'processing';

    // Update transaction
    const updates: any = {
      status: mappedStatus,
      moneroo_response: payload,
      updated_at: new Date().toISOString(),
    };

    if (mappedStatus === 'completed') {
      updates.completed_at = new Date().toISOString();

      // Update associated payment if exists
      if (transaction.payment_id) {
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            transaction_id: transaction_id,
          })
          .eq('id', transaction.payment_id);

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        }
      }

      // Update associated order if exists
      if (transaction.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', transaction.order_id);

        if (orderError) {
          console.error('Error updating order:', orderError);
        }
      }
    } else if (mappedStatus === 'failed') {
      updates.failed_at = new Date().toISOString();
      updates.error_message = payload.error_message || 'Payment failed';

      // Update payment and order status
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', transaction.payment_id);
      }

      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', transaction.order_id);
      }
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // Log the webhook event
    await supabase.from('transaction_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook_received',
      status: mappedStatus,
      response_data: payload,
    });

    console.log('Transaction updated successfully:', transaction.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
