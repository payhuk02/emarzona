import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' // Remplacer par votre domaine de production
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            transaction_id: transaction_id,
          })
          .eq('id', transaction.payment_id)
          .select('*, order_id, store_id')
          .single();

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        } else if (payment) {
          // Déclencher webhook payment.completed
          await supabase.rpc('trigger_webhook', {
            p_event_type: 'payment.completed',
            p_event_id: payment.id,
            p_event_data: {
              payment: {
                id: payment.id,
                order_id: payment.order_id,
                transaction_id: transaction_id,
                amount: transaction.amount,
                currency: transaction.currency,
                status: 'completed',
                payment_method: transaction.payment_method || 'moneroo',
                created_at: payment.created_at,
              },
            },
            p_store_id: payment.store_id,
          }).catch((err) => console.error('Webhook error:', err));
        }
      }

      // Update associated order if exists
      if (transaction.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', transaction.order_id)
          .select('*')
          .single();

        if (orderError) {
          console.error('Error updating order:', orderError);
        } else if (order) {
          // Déclencher webhook order.completed
          await supabase.rpc('trigger_webhook', {
            p_event_type: 'order.completed',
            p_event_id: order.id,
            p_event_data: {
              order: {
                id: order.id,
                store_id: order.store_id,
                customer_id: order.customer_id,
                order_number: order.order_number,
                status: 'confirmed',
                total_amount: order.total_amount,
                currency: order.currency,
                payment_status: 'paid',
                created_at: order.created_at,
              },
            },
            p_store_id: order.store_id,
          }).catch((err) => console.error('Webhook error:', err));
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
