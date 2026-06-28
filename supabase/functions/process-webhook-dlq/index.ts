import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { completeTransactionAndOrder } from '../_shared/complete-order-payment.ts';
// @ts-ignore
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';
// @ts-ignore
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';

// Le Worker DLQ s'exécute toutes les minutes via Cron et processe
// les événements qui ont échoué lors de l'ingestion hybride.

serve(async () => {
  const supabase = createSupabaseAdmin();
  const BATCH_SIZE = 50;

  try {
    // 1. Récupérer les événements 'failed' (retry < 5) ou les 'pending' bloqués depuis plus de 2 min
    const { data: eventsToProcess, error: fetchError } = await supabase
      .from('webhook_events')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lt('retry_count', 5)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError || !eventsToProcess) {
      throw new Error(`Erreur récupération events: ${fetchError?.message}`);
    }

    if (eventsToProcess.length === 0) {
      return new Response(JSON.stringify({ message: 'No events to process' }), { status: 200 });
    }

    const results = [];

    // 2. Traiter chaque événement
    for (const event of eventsToProcess) {
      // Si pending et très récent (< 2 minutes), on skip car potentiellement en cours de traitement synchrone
      if (event.status === 'pending') {
        const ageInMs = Date.now() - new Date(event.created_at).getTime();
        if (ageInMs < 2 * 60 * 1000) {
          continue;
        }
      }

      // ⏳ LOGIQUE EXPONENTIAL BACKOFF POUR LES EVENTS 'failed'
      if (event.status === 'failed') {
        const timeSinceLastUpdateMs = Date.now() - new Date(event.updated_at).getTime();

        // Seuils de Backoff selon le retry_count actuel :
        // 0 -> échec initial -> retry 1 attend 2 min
        // 1 -> échec retry 1 -> retry 2 attend 15 min
        // 2 -> échec retry 2 -> retry 3 attend 1 heure
        // 3 -> échec retry 3 -> retry 4 attend 6 heures
        let backoffMs = 0;
        switch (event.retry_count) {
          case 0:
            backoffMs = 2 * 60 * 1000;
            break; // 2 min
          case 1:
            backoffMs = 15 * 60 * 1000;
            break; // 15 min
          case 2:
            backoffMs = 60 * 60 * 1000;
            break; // 1 heure
          case 3:
            backoffMs = 6 * 60 * 60 * 1000;
            break; // 6 heures
          case 4:
            backoffMs = 24 * 60 * 60 * 1000;
            break; // 24 heures (avant mise en Dead Letter)
          default:
            backoffMs = 2 * 60 * 1000;
            break;
        }

        if (timeSinceLastUpdateMs < backoffMs) {
          // Le délai de backoff n'est pas encore écoulé, on skip silencieusement
          continue;
        }
      }

      // Marquer comme processing (pour empêcher une double exécution par un autre worker)
      await supabase
        .from('webhook_events')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', event.id);

      try {
        const payload = event.payload;

        // Logique de dispatch selon le provider et type
        if (event.provider === 'stripe' || event.provider === 'stripe_connect') {
          if (event.event_type === 'checkout.session.completed') {
            const transactionId = payload.metadata?.transaction_id;
            if (!transactionId) throw new Error('Missing transaction_id in metadata');

            const { orderId, alreadyCompleted } = await completeTransactionAndOrder(
              supabase,
              transactionId,
              {
                provider_session_id: payload.id,
                provider_payment_intent_id:
                  typeof payload.payment_intent === 'string' ? payload.payment_intent : undefined,
                webhookPayload: payload,
                paymentProviderUsed: event.provider,
                externalEventId: event.provider_event_id,
                eventType: event.event_type,
              }
            );

            if (orderId && !alreadyCompleted) {
              await runPostOrderPaymentFulfillment(supabase, orderId, transactionId);
            }
          }
          // Autres types (charge.refunded) à implémenter de la même manière
        }

        // Succès -> Completed
        await supabase
          .from('webhook_events')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        results.push({ id: event.id, status: 'completed' });
      } catch (err) {
        // Echec -> Failed + Increment Retry
        const errorMessage = err instanceof Error ? err.message : String(err);
        const newRetryCount = event.retry_count + 1;

        if (newRetryCount >= 5) {
          // Archiver dans la DLQ (Dead Letter Queue)
          await supabase.from('webhook_dlq').insert({
            webhook_event_id: event.id,
            provider: event.provider,
            provider_event_id: event.provider_event_id,
            event_type: event.event_type,
            payload: event.payload,
            last_error: errorMessage,
          });

          // Delete from main table to keep it light
          await supabase.from('webhook_events').delete().eq('id', event.id);
          results.push({ id: event.id, status: 'moved_to_dlq', error: errorMessage });
        } else {
          // Retry later
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: errorMessage,
              retry_count: newRetryCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', event.id);
          results.push({ id: event.id, status: 'failed', error: errorMessage });
        }
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('DLQ Worker Error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
