/**
 * Edge Function: Retry Failed Transactions
 * Date: 1 Février 2025
 * 
 * Description: Retry automatique des transactions en attente avec backoff exponentiel
 * 
 * Cron: Toutes les heures (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

/**
 * Vérifie le statut d'une transaction auprès du provider
 */
async function verifyTransactionWithProvider(
  supabase: any,
  transaction: any
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  try {
      if (transaction.payment_provider === 'moneroo' && transaction.moneroo_transaction_id) {
        // Appeler l'Edge Function moneroo pour vérifier le statut
        const monerooUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/moneroo`;
        const response = await fetch(monerooUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_payment',
            data: {
              paymentId: transaction.moneroo_transaction_id,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: `Moneroo API error: ${response.status} - ${errorText}` };
        }

        const responseData = await response.json();
        
        // La réponse Moneroo peut être dans data.data ou directement dans data
        const paymentData = responseData.data?.data || responseData.data || responseData;
        
        // Mapper le statut Moneroo vers notre statut
        const statusMap: Record<string, string> = {
          'completed': 'completed',
          'success': 'completed',
          'paid': 'completed',
          'failed': 'failed',
          'pending': 'processing',
          'cancelled': 'cancelled',
          'expired': 'cancelled',
        };

        const monerooStatus = paymentData.status?.toLowerCase() || paymentData.payment_status?.toLowerCase() || 'processing';
        const newStatus = statusMap[monerooStatus] || 'processing';

        return { 
          success: true, 
          newStatus,
          providerData: paymentData,
        };
      }

    // Pour PayDunya, on pourrait ajouter la logique ici
    // Pour l'instant, on retourne une erreur
    return { success: false, error: 'Provider not supported for automatic retry' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Met à jour le statut d'une transaction
 */
async function updateTransactionStatus(
  supabase: any,
  transactionId: string,
  newStatus: string,
  resultData?: any
): Promise<boolean> {
  try {
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    } else if (newStatus === 'failed') {
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

    // Si la transaction est complétée, mettre à jour l'order associé
    if (newStatus === 'completed') {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('order_id')
        .eq('id', transactionId)
        .single();

      if (transaction?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id);
      }
    }

    // Logger le retry
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
      .select('*')
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
          verificationResult
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
