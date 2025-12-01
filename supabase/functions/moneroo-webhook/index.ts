import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://payhula.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

async function calculateHMACSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function extractSignatureFromHeader(headers: Headers): string | null {
  const signature = headers.get('x-moneroo-signature') || 
                    headers.get('X-Moneroo-Signature') ||
                    headers.get('moneroo-signature');
  
  if (!signature) {
    return null;
  }

  const match = signature.match(/sha256=(.+)/i);
  return match ? match[1] : signature;
}

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  try {
    const calculatedSignature = await calculateHMACSignature(payload, secret);
    return constantTimeEquals(calculatedSignature, signature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Envoie les emails de confirmation de commande après paiement
 */
async function sendOrderConfirmationEmail(supabase: any, order: any): Promise<void> {
  try {
    // Récupérer les informations du client
    let customerEmail = order.customer_email;
    let customerName = order.customer_name || 'Client';
    let customerId = order.customer_id;

    // Si pas d'email dans l'order, chercher dans la table customers
    if (!customerEmail && order.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name, full_name')
        .eq('id', order.customer_id)
        .single();

      if (customer) {
        customerEmail = customer.email;
        customerName = customer.full_name || customer.name || 'Client';
      }
    }

    // Si toujours pas d'email, chercher dans auth.users via profiles
    if (!customerEmail && order.customer_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name')
        .eq('id', order.customer_id)
        .single();

      if (profile) {
        const { data: user } = await supabase.auth.admin.getUserById(order.customer_id);
        if (user?.user?.email) {
          customerEmail = user.user.email;
          customerName = profile.full_name || 
                        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                        'Client';
        }
      }
    }

    // Si on a toujours pas d'email, on ne peut pas envoyer d'email
    if (!customerEmail) {
      console.warn(`Cannot send confirmation email for order ${order.id}: no customer email found`);
      return;
    }

    // Appeler l'Edge Function pour envoyer les emails
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        order_id: order.id,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send order confirmation emails for order ${order.id}:`, errorText);
      throw new Error(`Email service returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Order confirmation emails sent for order ${order.id}:`, result);
  } catch (error) {
    console.error(`Error sending order confirmation emails for order ${order.id}:`, error);
    // Ne pas propager l'erreur pour ne pas bloquer le webhook
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookSecret = Deno.env.get('MONEROO_WEBHOOK_SECRET');
    
    const rawPayload = await req.text();
    
    if (webhookSecret) {
      const signature = extractSignatureFromHeader(req.headers);
      
      if (!signature) {
        console.error('Webhook signature missing');
        return new Response(
          JSON.stringify({ error: 'Webhook signature missing' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyWebhookSignature(rawPayload, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        await supabase.from('transaction_logs').insert({
          event_type: 'webhook_signature_failed',
          status: 'failed',
          request_data: {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString(),
          },
          error_data: {
            error: 'Invalid webhook signature',
            signature_preview: signature.substring(0, 20) + '...',
          },
        }).catch(err => console.error('Error logging failed webhook:', err));

        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('MONEROO_WEBHOOK_SECRET not configured - webhook signature verification disabled');
    }

    const payload = JSON.parse(rawPayload);
    console.log('Moneroo webhook received:', payload);

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
      'refunded': 'refunded',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'processing';

    // 🆕 Vérifier l'idempotence (éviter les webhooks dupliqués)
    if (mappedStatus === transaction.status) {
      // Si le statut est identique, vérifier si le webhook a déjà été traité
      const { data: alreadyProcessed } = await supabase.rpc('is_webhook_already_processed', {
        p_transaction_id: transaction.id,
        p_status: mappedStatus,
        p_provider: 'moneroo',
      });

      if (alreadyProcessed) {
        console.log('Webhook already processed, ignoring duplicate');
        return new Response(
          JSON.stringify({ success: true, message: 'Webhook already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 🔒 SÉCURITÉ: Valider le montant avant de mettre à jour la transaction
    if (amount && transaction.order_id) {
      // Récupérer le montant de la commande
      const { data: orderData } = await supabase
        .from('orders')
        .select('total_amount, currency')
        .eq('id', transaction.order_id)
        .single();

      if (orderData) {
        const webhookAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const orderAmount = typeof orderData.total_amount === 'string' 
          ? parseFloat(orderData.total_amount) 
          : orderData.total_amount;

        // Tolérance de 1 XOF pour les arrondis
        const tolerance = 1;
        const amountDifference = Math.abs(webhookAmount - orderAmount);

        if (amountDifference > tolerance) {
          console.error('🚨 SECURITY ALERT: Amount mismatch detected', {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            webhook_amount: webhookAmount,
            order_amount: orderAmount,
            difference: amountDifference,
            tolerance,
          });

          // Logger l'alerte de sécurité
          await supabase.from('transaction_logs').insert({
            event_type: 'webhook_amount_mismatch',
            status: 'failed',
            transaction_id: transaction.id,
            request_data: {
              webhook_amount: webhookAmount,
              order_amount: orderAmount,
              difference: amountDifference,
              timestamp: new Date().toISOString(),
            },
            error_data: {
              error: 'Amount mismatch - possible fraud attempt',
              severity: 'high',
            },
          }).catch(err => console.error('Error logging amount mismatch:', err));

          // Rejeter le webhook si la différence est significative (> 10 XOF)
          if (amountDifference > 10) {
            return new Response(
              JSON.stringify({ 
                error: 'Amount mismatch - transaction rejected',
                webhook_amount: webhookAmount,
                expected_amount: orderAmount,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Si la différence est petite mais > tolérance, logger mais continuer
          console.warn('Amount mismatch within tolerance, proceeding with caution');
        }
      }
    }

    // Update transaction
    const updates: any = {
      status: mappedStatus,
      moneroo_response: payload,
      updated_at: new Date().toISOString(),
      webhook_processed_at: new Date().toISOString(),
      webhook_attempts: (transaction.webhook_attempts || 0) + 1,
      last_webhook_payload: payload,
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
                payment_method: transaction.moneroo_payment_method || 'moneroo',
                created_at: payment.created_at,
              },
            },
            p_store_id: payment.store_id,
          }).catch((err) => console.error('Webhook error:', err));
        }
      }

      // Update associated order if exists
      let order = null;
      if (transaction.order_id) {
        const { data: orderData, error: orderError } = await supabase
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
        } else {
          order = orderData;
          // Déclencher webhook order.completed via la nouvelle fonction
          await supabase.rpc('trigger_webhook', {
            p_store_id: order.store_id,
            p_event_type: 'order.completed',
            p_payload: {
              order_id: order.id,
              order_number: order.order_number,
              customer_id: order.customer_id,
              total_amount: order.total_amount,
              currency: order.currency,
              status: 'confirmed',
              payment_status: 'paid',
              created_at: order.created_at,
            },
          }).catch((err) => console.error('Webhook error:', err));
          
          // Déclencher aussi payment.completed
          await supabase.rpc('trigger_webhook', {
            p_store_id: order.store_id,
            p_event_type: 'payment.completed',
            p_payload: {
              transaction_id: transaction.id,
              order_id: order.id,
              order_number: order.order_number,
              amount: transaction.amount,
              currency: transaction.currency,
              payment_method: transaction.payment_method,
              customer_id: order.customer_id,
            },
          }).catch((err) => console.error('Payment webhook error:', err));

          // 🆕 Vérifier si toutes les commandes du groupe multi-stores sont payées
          // La fonction SQL check_and_notify_multi_store_group_completion sera appelée
          // automatiquement par le trigger, mais on peut aussi l'appeler manuellement pour être sûr
          if (order.metadata && typeof order.metadata === 'object' && 
              (order.metadata as any).multi_store === true && 
              (order.metadata as any).group_id) {
            await supabase.rpc('check_and_notify_multi_store_group_completion', {
              p_order_id: order.id,
            }).catch((err) => {
              console.error('Error checking multi-store group completion:', err);
            });
          }

          // 🆕 Envoyer les emails de confirmation de commande
          if (order) {
            await sendOrderConfirmationEmail(supabase, order).catch((err) => {
              console.error('Error sending order confirmation emails:', err);
              // Ne pas bloquer le webhook si l'envoi d'email échoue
            });
          }
        }
      }

      // Créer une notification de paiement réussi (individuelle)
      if (transaction.customer_id) {
        await supabase.from('notifications').insert({
          user_id: transaction.customer_id,
          type: 'payment_completed',
          title: '✅ Paiement réussi !',
          message: `Votre paiement de ${transaction.amount} ${transaction.currency} a été confirmé avec succès.${order?.order_number ? ` Commande #${order.order_number}` : ''}`,
          metadata: {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.moneroo_payment_method || 'moneroo',
          },
          is_read: false,
        }).catch((err) => console.error('Error creating notification:', err));
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

      // Créer une notification de paiement échoué
      if (transaction.customer_id) {
        await supabase.from('notifications').insert({
          user_id: transaction.customer_id,
          type: 'payment_failed',
          title: '❌ Paiement échoué',
          message: `Votre paiement de ${transaction.amount} ${transaction.currency} a échoué. Veuillez réessayer.`,
          metadata: {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            amount: transaction.amount,
            currency: transaction.currency,
            error_message: payload.error_message,
          },
          is_read: false,
        }).catch((err) => console.error('Error creating notification:', err));
      }
    } else if (mappedStatus === 'refunded') {
      updates.refunded_at = new Date().toISOString();
      updates.moneroo_refund_id = payload.refund_id;
      updates.moneroo_refund_amount = payload.amount;
      updates.moneroo_refund_reason = payload.reason;

      // Create refund notification
      if (transaction.customer_id) {
        await supabase.from('notifications').insert({
          user_id: transaction.customer_id,
          type: 'payment_refunded',
          title: '🔄 Paiement remboursé',
          message: `Votre paiement de ${payload.amount} ${payload.currency} a été remboursé.`,
          metadata: {
            transaction_id: transaction.id,
            refund_id: payload.refund_id,
            amount: payload.amount,
            currency: payload.currency,
            reason: payload.reason,
          },
          is_read: false,
        }).catch((err) => console.error('Error creating refund notification:', err));
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
