import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
  const signature =
    headers.get('x-moneroo-signature') ||
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
          customerName =
            profile.full_name ||
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
        Authorization: `Bearer ${supabaseServiceKey}`,
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

serve(async req => {
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
        return new Response(JSON.stringify({ error: 'Webhook signature missing' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isValid = await verifyWebhookSignature(rawPayload, signature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        await supabase
          .from('transaction_logs')
          .insert({
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
          })
          .catch(err => console.error('Error logging failed webhook:', err));

        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Webhook signature verified successfully');
    } else {
      console.warn(
        'MONEROO_WEBHOOK_SECRET not configured - webhook signature verification disabled'
      );
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
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      pending: 'processing',
      cancelled: 'cancelled',
      refunded: 'refunded',
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
        const orderAmount =
          typeof orderData.total_amount === 'string'
            ? parseFloat(orderData.total_amount)
            : orderData.total_amount;

        // Récupérer la tolérance depuis platform_settings (défaut: 1 XOF)
        let tolerance = 1.0;
        try {
          const { data: settings } = await supabase
            .from('platform_settings')
            .select('settings')
            .eq('key', 'admin')
            .single();

          if (settings?.settings?.max_amount_tolerance) {
            tolerance = parseFloat(settings.settings.max_amount_tolerance.toString()) || 1.0;
          }
        } catch (error) {
          console.warn(
            'Could not fetch max_amount_tolerance from platform_settings, using default:',
            error
          );
        }

        const amountDifference = Math.abs(webhookAmount - orderAmount);

        if (amountDifference > tolerance) {
          console.error('🚨 SECURITY ALERT: Amount mismatch detected', {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            webhook_amount: webhookAmount,
            order_amount: orderAmount,
            difference: amountDifference,
            tolerance,
            percentage_diff: ((amountDifference / orderAmount) * 100).toFixed(2) + '%',
          });

          // Logger l'alerte de sécurité
          await supabase
            .from('transaction_logs')
            .insert({
              event_type: 'webhook_amount_mismatch',
              status: 'failed',
              transaction_id: transaction.id,
              request_data: {
                webhook_amount: webhookAmount,
                order_amount: orderAmount,
                difference: amountDifference,
                tolerance,
                percentage_diff: ((amountDifference / orderAmount) * 100).toFixed(2) + '%',
                timestamp: new Date().toISOString(),
              },
              error_data: {
                error: 'Amount mismatch - possible fraud attempt',
                severity: 'high',
              },
            })
            .catch(err => console.error('Error logging amount mismatch:', err));

          // 🔴 REJETER le webhook si la différence dépasse la tolérance configurée
          // Plus de tolérance de 10 XOF - on utilise maintenant la tolérance configurée
          return new Response(
            JSON.stringify({
              error: 'Amount mismatch - transaction rejected',
              message: `Webhook amount (${webhookAmount}) differs from order amount (${orderAmount}) by ${amountDifference} XOF, exceeding tolerance of ${tolerance} XOF`,
              webhook_amount: webhookAmount,
              expected_amount: orderAmount,
              difference: amountDifference,
              tolerance,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          await supabase
            .rpc('trigger_webhook', {
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
            })
            .catch(err => console.error('Webhook error:', err));
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
        } else if (orderData) {
          order = orderData;
          // TypeScript assertion: orderData est non-null ici
          const currentOrder = orderData;
          // Déclencher webhook order.completed via la nouvelle fonction
          await supabase
            .rpc('trigger_webhook', {
              p_store_id: currentOrder.store_id,
              p_event_type: 'order.completed',
              p_payload: {
                order_id: currentOrder.id,
                order_number: currentOrder.order_number,
                customer_id: currentOrder.customer_id,
                total_amount: currentOrder.total_amount,
                currency: currentOrder.currency,
                status: 'confirmed',
                payment_status: 'paid',
                created_at: currentOrder.created_at,
              },
            })
            .catch(err => console.error('Webhook error:', err));

          // Déclencher aussi payment.completed
          await supabase
            .rpc('trigger_webhook', {
              p_store_id: currentOrder.store_id,
              p_event_type: 'payment.completed',
              p_payload: {
                transaction_id: transaction.id,
                order_id: currentOrder.id,
                order_number: currentOrder.order_number,
                amount: transaction.amount,
                currency: transaction.currency,
                payment_method: transaction.payment_method,
                customer_id: currentOrder.customer_id,
              },
            })
            .catch(err => console.error('Payment webhook error:', err));

          // 🆕 Confirmer automatiquement les bookings de service après paiement
          try {
            const { data: serviceOrderItems, error: serviceItemsError } = await supabase
              .from('order_items')
              .select('id, booking_id, product_type')
              .eq('order_id', currentOrder.id)
              .eq('product_type', 'service')
              .not('booking_id', 'is', null);

            if (!serviceItemsError && serviceOrderItems && serviceOrderItems.length > 0) {
              // Confirmer tous les bookings associés
              for (const item of serviceOrderItems) {
                if (item.booking_id) {
                  const { error: bookingUpdateError } = await supabase
                    .from('service_bookings')
                    .update({
                      status: 'confirmed',
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.booking_id)
                    .eq('status', 'pending'); // Seulement si encore pending

                  if (bookingUpdateError) {
                    console.error(
                      `Error confirming booking ${item.booking_id}:`,
                      bookingUpdateError
                    );
                  } else {
                    console.log(`Booking ${item.booking_id} confirmed after payment`);

                    // Déclencher webhook service.booking_confirmed
                    await supabase
                      .rpc('trigger_webhook', {
                        p_store_id: currentOrder.store_id,
                        p_event_type: 'service.booking_confirmed',
                        p_payload: {
                          booking_id: item.booking_id,
                          order_id: currentOrder.id,
                          order_number: currentOrder.order_number,
                          status: 'confirmed',
                          confirmed_at: new Date().toISOString(),
                        },
                      })
                      .catch(err => console.error('Service booking confirmed webhook error:', err));
                  }
                }
              }
            }
          } catch (serviceBookingError) {
            console.error('Error confirming service bookings:', serviceBookingError);
            // Ne pas bloquer le webhook si la confirmation échoue
          }

          // 🆕 Vérifier si toutes les commandes du groupe multi-stores sont payées
          // La fonction SQL check_and_notify_multi_store_group_completion sera appelée
          // automatiquement par le trigger, mais on peut aussi l'appeler manuellement pour être sûr
          if (
            currentOrder.metadata &&
            typeof currentOrder.metadata === 'object' &&
            (currentOrder.metadata as any).multi_store === true &&
            (currentOrder.metadata as any).group_id
          ) {
            await supabase
              .rpc('check_and_notify_multi_store_group_completion', {
                p_order_id: currentOrder.id,
              })
              .catch(err => {
                console.error('Error checking multi-store group completion:', err);
              });
          }

          // 🆕 Envoyer les emails de confirmation de commande
          if (order) {
            await sendOrderConfirmationEmail(supabase, order).catch(err => {
              console.error('Error sending order confirmation emails:', err);
              // Ne pas bloquer le webhook si l'envoi d'email échoue
            });
          }

          // 🆕 Générer automatiquement les certificats pour les œuvres d'artiste
          if (orderData) {
            const currentOrderForCert = orderData; // Variable locale pour TypeScript
            try {
              // Récupérer les order_items pour vérifier les produits artistes
              const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('id, product_id, product_type, metadata')
                .eq('order_id', currentOrderForCert.id)
                .eq('product_type', 'artist');

              if (!itemsError && orderItems && orderItems.length > 0) {
                // Récupérer le customer_id pour obtenir le user_id
                const { data: customer } = await supabase
                  .from('customers')
                  .select('id, user_id')
                  .eq('id', currentOrderForCert.customer_id)
                  .single();

                const userId = customer?.user_id || transaction.customer_id;

                // Générer un certificat pour chaque produit artiste
                for (const item of orderItems) {
                  try {
                    const metadata =
                      typeof item.metadata === 'string'
                        ? JSON.parse(item.metadata)
                        : item.metadata || {};
                    const artistProductId = metadata.artist_product_id;

                    if (artistProductId && userId) {
                      // Vérifier si un certificat doit être généré
                      const { data: artistProduct } = await supabase
                        .from('artist_products')
                        .select('certificate_of_authenticity, artwork_edition_type')
                        .eq('id', artistProductId)
                        .single();

                      const shouldGenerate =
                        artistProduct &&
                        (artistProduct.certificate_of_authenticity === true ||
                          artistProduct.artwork_edition_type === 'limited_edition');

                      if (shouldGenerate) {
                        // Appeler l'Edge Function pour générer le certificat
                        const certResponse = await fetch(
                          `${supabaseUrl}/functions/v1/generate-artist-certificate`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${supabaseServiceKey}`,
                            },
                            body: JSON.stringify({
                              order_id: currentOrderForCert.id,
                              order_item_id: item.id,
                              product_id: item.product_id,
                              artist_product_id: artistProductId,
                              user_id: userId,
                            }),
                          }
                        ).catch(certErr => {
                          console.error('Error calling certificate generation function:', certErr);
                          return null;
                        });

                        if (certResponse && !certResponse.ok) {
                          const errorText = await certResponse.text();
                          console.error('Error generating artist certificate:', errorText);
                        }
                      }

                      // 🆕 Créer automatiquement un enregistrement de provenance pour le transfert de propriété
                      try {
                        // Récupérer les informations du produit artiste
                        const { data: fullArtistProduct } = await supabase
                          .from('artist_products')
                          .select('store_id, artist_name, artwork_title')
                          .eq('id', artistProductId)
                          .single();

                        if (fullArtistProduct) {
                          // Récupérer les informations du client/acheteur
                          const { data: buyerInfo } = await supabase
                            .from('customers')
                            .select('name, full_name, email')
                            .eq('id', currentOrderForCert.customer_id)
                            .single();

                          const buyerName =
                            buyerInfo?.full_name ||
                            buyerInfo?.name ||
                            currentOrderForCert.customer_email ||
                            'Acheteur';

                          // Récupérer le propriétaire précédent (vendeur/store owner)
                          const { data: storeInfo } = await supabase
                            .from('stores')
                            .select('name, owner_id')
                            .eq('id', fullArtistProduct.store_id)
                            .single();

                          const previousOwnerName = storeInfo?.name || 'Vendeur';

                          // Créer l'enregistrement de provenance
                          const { error: provenanceError } = await supabase
                            .from('artwork_provenance')
                            .insert({
                              product_id: item.product_id,
                              store_id: fullArtistProduct.store_id,
                              provenance_type: 'ownership',
                              event_date: new Date().toISOString().split('T')[0],
                              previous_owner_name: previousOwnerName,
                              current_owner_id: userId,
                              current_owner_name: buyerName,
                              description: `Transfert de propriété suite à la vente - Commande #${currentOrderForCert.order_number || currentOrderForCert.id}`,
                              is_verified: true,
                              metadata: {
                                order_id: currentOrderForCert.id,
                                order_item_id: item.id,
                                transaction_id: transaction.id,
                                purchase_date: new Date().toISOString(),
                              },
                            });

                          if (provenanceError) {
                            console.error('Error creating provenance record:', provenanceError);
                          } else {
                            console.log(
                              'Provenance record created successfully for artist product',
                              {
                                product_id: item.product_id,
                                order_id: currentOrderForCert.id,
                              }
                            );
                          }
                        }
                      } catch (provErr) {
                        console.error('Error creating provenance record:', provErr);
                        // Ne pas bloquer le webhook si la création de provenance échoue
                      }
                    }
                  } catch (itemErr) {
                    console.error('Error processing order item for certificate:', itemErr);
                  }
                }
              }
            } catch (certError) {
              console.error('Error in certificate generation process:', certError);
              // Ne pas bloquer le webhook si la génération échoue
            }
          }
        }
      }

      // ✅ Créer une notification de paiement réussi
      // NOTE: Cette notification sera automatiquement affichée avec son via useRealtimeNotifications
      // Pour une meilleure cohérence, idéalement utiliser sendUnifiedNotification (nécessite adaptation pour Edge Functions)
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.customer_id,
            type: 'order_payment_received', // ✅ Utiliser le type unifié
            title: '✅ Paiement réussi !',
            message: `Votre paiement de ${transaction.amount} ${transaction.currency} a été confirmé avec succès.${transaction.order_id ? ` Commande #${transaction.order_id}` : ''}`,
            priority: 'high', // ✅ Priorité haute pour notification importante
            metadata: {
              transaction_id: transaction.id,
              order_id: transaction.order_id,
              amount: transaction.amount,
              currency: transaction.currency,
              payment_method: transaction.moneroo_payment_method || 'moneroo',
            },
            action_url: transaction.order_id ? `/orders/${transaction.order_id}` : '/orders',
            action_label: 'Voir la commande',
            is_read: false,
          })
          .catch(err => console.error('Error creating notification:', err));

        // ✅ Envoyer également un email via Edge Function pour multi-canaux
        try {
          const { data: user } = await supabase.auth.admin.getUserById(transaction.customer_id);
          if (user?.user?.email) {
            await supabase.functions
              .invoke('send-email', {
                body: {
                  to: user.user.email,
                  subject: '✅ Paiement confirmé - Emarzona',
                  template: 'payment-received',
                  data: {
                    order_number: (order as any)?.order_number || transaction.order_id,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    transaction_id: transaction.id,
                  },
                },
              })
              .catch(err => console.error('Error sending payment email:', err));
          }
        } catch (emailErr) {
          console.error('Error sending payment email:', emailErr);
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

      // ✅ Créer une notification de paiement échoué
      // NOTE: Cette notification sera automatiquement affichée avec son via useRealtimeNotifications
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.customer_id,
            type: 'order_payment_failed', // ✅ Utiliser le type unifié
            title: '❌ Paiement échoué',
            message: `Votre paiement de ${transaction.amount} ${transaction.currency} a échoué. Veuillez réessayer.`,
            priority: 'high', // ✅ Priorité haute pour notification importante
            metadata: {
              transaction_id: transaction.id,
              order_id: transaction.order_id,
              amount: transaction.amount,
              currency: transaction.currency,
              error_message: payload.error_message,
            },
            action_url: transaction.order_id ? `/orders/${transaction.order_id}` : '/orders',
            action_label: 'Réessayer le paiement',
            is_read: false,
          })
          .catch(err => console.error('Error creating notification:', err));

        // ✅ Envoyer également un email via Edge Function pour multi-canaux
        try {
          const { data: user } = await supabase.auth.admin.getUserById(transaction.customer_id);
          if (user?.user?.email) {
            const currentOrder = transaction.order_id
              ? await supabase
                  .from('orders')
                  .select('order_number')
                  .eq('id', transaction.order_id)
                  .single()
                  .then(({ data }) => data)
              : null;
            await supabase.functions
              .invoke('send-email', {
                body: {
                  to: user.user.email,
                  subject: '❌ Paiement échoué - Emarzona',
                  template: 'payment-failed',
                  data: {
                    order_number: currentOrder?.order_number,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    error_message: payload.error_message,
                    transaction_id: transaction.id,
                  },
                },
              })
              .catch(err => console.error('Error sending payment failed email:', err));
          }
        } catch (emailErr) {
          console.error('Error sending payment failed email:', emailErr);
        }
      }
    } else if (mappedStatus === 'refunded') {
      updates.refunded_at = new Date().toISOString();
      updates.moneroo_refund_id = payload.refund_id;
      updates.moneroo_refund_amount = payload.amount;
      updates.moneroo_refund_reason = payload.reason;

      // 🔧 CORRECTION : Mettre à jour l'order associée pour déclencher la mise à jour de store_earnings
      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id)
          .catch(err => console.error('Error updating order with refund:', err));
      }

      // Create refund notification
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
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
          })
          .catch(err => console.error('Error creating refund notification:', err));
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

    return new Response(JSON.stringify({ success: true, message: 'Webhook processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
