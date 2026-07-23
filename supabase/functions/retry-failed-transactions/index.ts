/**
 * Edge Function: Retry Failed Transactions
 * Date: 1 Février 2025
 * 
 * Description: Retry automatique des transactions en attente avec backoff exponentiel
 * 
 * Cron: Toutes les heures (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { completeTransactionAndOrder } from '../_shared/complete-order-payment.ts';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface RetryConfig {
  maxAttempts: number;
  backoffIntervals: number[]; // En heures: [1, 6, 24]
  minAgeForRetry: number; // En heures: transactions plus anciennes que X heures
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffIntervals: [1, 6, 24], // 1h, 6h, 24h
  minAgeForRetry: 1, // Retry après 1h minimum
};

// Note: La logique de shouldRetry est maintenant gérée par la fonction SQL get_pending_transaction_retries()
// qui utilise la table transaction_retries avec next_retry_at et les stratégies de backoff

const STATUS_MAP: Record<string, string> = {
  completed: 'completed',
  success: 'completed',
  paid: 'completed',
  failed: 'failed',
  failure: 'failed',
  pending: 'processing',
  processing: 'processing',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  'no paid': 'cancelled',
  expired: 'cancelled',
  refunded: 'refunded',
};

function resolveExternalPaymentId(transaction: {
  payment_provider?: string | null;
  payment_id?: string | null;
  geniuspay_transaction_id?: string | null;
}): string | null {
  const provider = String(transaction.payment_provider || '').toLowerCase();
  if (provider === 'moneyfusion') {
    return String(transaction.payment_id || transaction.geniuspay_transaction_id || '').trim() || null;
  }
  if (provider === 'geniuspay') {
    return String(transaction.geniuspay_transaction_id || transaction.payment_id || '').trim() || null;
  }
  return String(transaction.payment_id || transaction.geniuspay_transaction_id || '').trim() || null;
}

/**
 * Vérifie le statut d'une transaction auprès du provider (MoneyFusion ou GeniusPay).
 */
async function verifyTransactionWithProvider(
  _supabase: unknown,
  transaction: {
    payment_provider?: string | null;
    payment_id?: string | null;
    geniuspay_transaction_id?: string | null;
  }
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  try {
    const provider = String(transaction.payment_provider || '').toLowerCase();
    const externalId = resolveExternalPaymentId(transaction);
    if (!externalId) {
      return { success: false, error: 'Identifiant PSP manquant' };
    }

    if (provider === 'moneyfusion') {
      const moneyfusionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/moneyfusion`;
      const response = await fetch(moneyfusionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_payment',
          data: { paymentId: externalId, token: externalId },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `MoneyFusion API error: ${response.status} - ${errorText}`,
        };
      }

      const responseData = await response.json();
      const outer = responseData.data || responseData;
      const paymentData =
        outer?.data && typeof outer.data === 'object' ? outer.data : outer;
      const rawStatus = String(
        paymentData.statut || paymentData.status || paymentData.payment_status || 'processing'
      ).toLowerCase();
      const newStatus = STATUS_MAP[rawStatus] || 'processing';
      const base = Number(paymentData.Montant ?? paymentData.montant ?? paymentData.amount ?? 0);
      const fees = Number(paymentData.frais ?? paymentData.fee ?? 0);
      return {
        success: true,
        newStatus,
        pspAmount: Number.isFinite(base) ? base + (Number.isFinite(fees) ? fees : 0) : undefined,
        rawStatus,
      };
    }

    if (provider === 'geniuspay') {
      const geniuspayUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/geniuspay`;
      const response = await fetch(geniuspayUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_payment',
          data: { paymentId: externalId },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `GeniusPay API error: ${response.status} - ${errorText}`,
        };
      }

      const responseData = await response.json();
      const paymentData = responseData.data?.data || responseData.data || responseData;
      const geniuspayStatus =
        paymentData.status?.toLowerCase() ||
        paymentData.payment_status?.toLowerCase() ||
        'processing';
      const newStatus = STATUS_MAP[geniuspayStatus] || 'processing';
      return { success: true, newStatus };
    }

    return { success: false, error: `Provider not supported for automatic retry: ${provider || 'unknown'}` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Met à jour le statut d'une transaction.
 * Sur completed: passe par completeTransactionAndOrder + S4 fulfillment (pas de bypass).
 */
async function updateTransactionStatus(
  supabase: any,
  transactionId: string,
  newStatus: string,
  resultData?: any,
  paymentProvider?: string
): Promise<boolean> {
  try {
    if (newStatus === 'completed') {
      const provider = String(paymentProvider || 'moneyfusion').toLowerCase();
      const externalEventId = `retry-failed:${transactionId}:${Date.now()}`;
      const { orderId, alreadyCompleted } = await completeTransactionAndOrder(
        supabase,
        transactionId,
        {
          webhookPayload: resultData ?? { source: 'retry-failed-transactions' },
          paymentProviderUsed: provider,
          externalEventId,
          eventType: 'retry_verification',
        }
      );

      const { data: tx } = await supabase
        .from('transactions')
        .select('order_id')
        .eq('id', transactionId)
        .maybeSingle();

      const fulfillmentOrderId = orderId || tx?.order_id || null;
      if (fulfillmentOrderId) {
        await runPostOrderPaymentFulfillment(supabase, fulfillmentOrderId, transactionId);
      } else if (!alreadyCompleted) {
        console.warn('retry-failed: completed without order_id', { transactionId });
      }

      await supabase.from('transaction_logs').insert({
        transaction_id: transactionId,
        event_type: 'retry_verification',
        status: newStatus,
        response_data: resultData,
      });

      return true;
    }

    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'failed') {
      updates.failed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId);

    if (error) {
      console.error('Error updating transaction:', error);
      return false;
    }

    await supabase.from('transaction_logs').insert({
      transaction_id: transactionId,
      event_type: 'retry_verification',
      status: newStatus,
      response_data: resultData,
    });

    return true;
  } catch (error) {
    console.error('Error in updateTransactionStatus:', error);
    return false;
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting automatic transaction retry job...');

    // Récupérer la configuration depuis platform_settings (optionnel)
    let retryConfig = DEFAULT_RETRY_CONFIG;
    try {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('key', 'admin')
        .single();

      if (settings?.settings?.retry_config) {
        retryConfig = { ...DEFAULT_RETRY_CONFIG, ...settings.settings.retry_config };
      }
    } catch (error) {
      console.warn('Could not fetch retry config, using defaults:', error);
    }

    // Utiliser la fonction SQL existante pour récupérer les retries à traiter
    const { data: pendingRetries, error: fetchError } = await supabase
      .rpc('get_pending_transaction_retries');

    if (fetchError) {
      throw new Error(`Error fetching pending retries: ${fetchError.message}`);
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      console.log('✅ No transactions eligible for retry');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No transactions eligible for retry',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${pendingRetries.length} transactions to retry`);

    // Récupérer les détails complets des transactions
    const transactionIds = pendingRetries.map((r: any) => r.transaction_id);
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(
        'id,status,payment_provider,geniuspay_transaction_id,order_id,payment_id,amount,currency,customer_id,payment_method,geniuspay_payment_method,webhook_attempts'
      )
      .in('id', transactionIds);

    if (transactionsError) {
      throw new Error(`Error fetching transactions: ${transactionsError.message}`);
    }

    if (!transactions || transactions.length === 0) {
      console.log('✅ No transactions eligible for retry');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No transactions eligible for retry',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${transactions.length} transactions to check`);

    let processed = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    // Créer un map pour accéder rapidement aux transactions
    const transactionsMap = new Map(transactions?.map((t: any) => [t.id, t]) || []);

    for (const retryInfo of pendingRetries) {
      const transaction = transactionsMap.get(retryInfo.transaction_id);
      
      if (!transaction) {
        console.warn(`⚠️  Transaction ${retryInfo.transaction_id} not found`);
        skipped++;
        continue;
      }

      processed++;

      console.log(`🔄 Retrying transaction ${transaction.id} (attempt ${retryInfo.attempt_number})...`);

      // Mettre à jour le statut de la retry à 'processing'
      const { data: retryRecord, error: retryError } = await supabase
        .from('transaction_retries')
        .update({
          status: 'processing',
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', retryInfo.retry_id)
        .select()
        .single();

      if (retryError) {
        console.error(`❌ Error updating retry record for ${transaction.id}:`, retryError);
        failed++;
        continue;
      }

      // Vérifier le statut auprès du provider
      const verificationResult = await verifyTransactionWithProvider(supabase, transaction);

      if (verificationResult.success && verificationResult.newStatus) {
        // Mettre à jour la transaction
        const updateSuccess = await updateTransactionStatus(
          supabase,
          transaction.id,
          verificationResult.newStatus,
          verificationResult,
          transaction.payment_provider
        );

        if (updateSuccess) {
          // Marquer le retry comme complété
          await supabase
            .from('transaction_retries')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              last_attempt_result: verificationResult,
              updated_at: new Date().toISOString(),
            })
            .eq('id', retryInfo.retry_id);

          console.log(`✅ Transaction ${transaction.id} updated to ${verificationResult.newStatus}`);
          updated++;
        } else {
          failed++;
        }
      } else {
        // Si on n'a pas atteint le maximum, créer la prochaine tentative
        if (retryInfo.attempt_number < retryInfo.max_attempts) {
          // Créer la prochaine tentative via la fonction SQL
          await supabase.rpc('create_or_update_transaction_retry', {
            p_transaction_id: transaction.id,
            p_max_attempts: retryInfo.max_attempts,
            p_strategy: 'exponential',
          });
        }

        // Marquer le retry actuel comme échoué
        await supabase
          .from('transaction_retries')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: verificationResult.error,
            last_attempt_result: { error: verificationResult.error },
            updated_at: new Date().toISOString(),
          })
          .eq('id', retryInfo.retry_id);

        console.log(`⚠️  Transaction ${transaction.id} verification failed: ${verificationResult.error}`);
        failed++;
      }

      // Petite pause pour éviter de surcharger les APIs
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      success: true,
      message: 'Retry job completed',
      stats: {
        total_checked: pendingRetries.length,
        processed: processed,
        updated: updated,
        failed: failed,
        skipped: skipped,
      },
    };

    console.log('✅ Retry job completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in retry job:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
