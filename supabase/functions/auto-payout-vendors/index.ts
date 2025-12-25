/**
 * Edge Function: Auto Payout Vendors
 * Date: 30 Janvier 2025
 * 
 * Description: Reversement automatique des fonds vendeurs qui dépassent le seuil minimum après un délai configuré
 * 
 * Cron: Tous les jours à 3h du matin (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPayoutConfig {
  enabled: boolean;
  delayDays: number; // Délai en jours avant reversement automatique (défaut: 7)
  minAmount: number; // Montant minimum en XOF (défaut: 50000)
}

const DEFAULT_CONFIG: AutoPayoutConfig = {
  enabled: false,
  delayDays: 7,
  minAmount: 50000,
};

/**
 * Récupère la configuration depuis platform_settings
 */
async function getAutoPayoutConfig(supabase: any): Promise<AutoPayoutConfig> {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', 'admin')
      .single();

    if (settings?.settings?.auto_payout_vendors) {
      const config = settings.settings.auto_payout_vendors;
      return {
        enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
        delayDays: config.delay_days ?? DEFAULT_CONFIG.delayDays,
        minAmount: config.min_amount ?? DEFAULT_CONFIG.minAmount,
      };
    }
  } catch (error) {
    console.warn('Could not fetch auto-payout config, using defaults:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Récupère les stores éligibles pour reversement automatique
 */
async function getEligibleStores(
  supabase: any,
  config: AutoPayoutConfig
): Promise<any[]> {
  try {
    // Date limite : maintenant - delayDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.delayDays);
    const cutoffDateISO = cutoffDate.toISOString();

    // Récupérer les stores avec available_balance >= minAmount
    // et dont le dernier calcul est antérieur à delayDays
    const { data: stores, error } = await supabase
      .from('store_earnings')
      .select(`
        store_id,
        available_balance,
        last_calculated_at,
        stores!inner(
          id,
          name,
          user_id,
          store_payment_methods!inner(
            id,
            payment_method,
            payment_details,
            is_default
          )
        )
      `)
      .gte('available_balance', config.minAmount)
      .or(`last_calculated_at.is.null,last_calculated_at.lt.${cutoffDateISO}`)
      .eq('stores.store_payment_methods.is_default', true)
      .limit(50); // Limiter à 50 stores par exécution pour éviter la surcharge

    if (error) {
      console.error('Error fetching eligible stores:', error);
      return [];
    }

    return stores || [];
  } catch (error) {
    console.error('Error in getEligibleStores:', error);
    return [];
  }
}

/**
 * Crée un retrait automatique pour un store
 */
async function createAutomaticWithdrawal(
  supabase: any,
  storeId: string,
  amount: number,
  paymentMethod: string,
  paymentDetails: any
): Promise<string | null> {
  try {
    // Vérifier qu'il n'y a pas déjà un retrait en attente
    const { data: pendingWithdrawals } = await supabase
      .from('store_withdrawals')
      .select('id')
      .eq('store_id', storeId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      console.log(`Store ${storeId} already has a pending withdrawal, skipping`);
      return null;
    }

    // Créer le retrait
    const { data: withdrawal, error } = await supabase
      .from('store_withdrawals')
      .insert({
        store_id: storeId,
        amount: amount,
        currency: 'XOF',
        payment_method: paymentMethod,
        payment_details: paymentDetails || {},
        status: 'pending', // Admin devra approuver
        notes: `Reversement automatique - seuil minimum atteint après ${new Date().toISOString().split('T')[0]}`,
        admin_notes: 'Créé automatiquement par le système de reversement automatique',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating automatic withdrawal:', error);
      return null;
    }

    console.log(`Created automatic withdrawal ${withdrawal.id} for store ${storeId} (amount: ${amount} XOF)`);
    return withdrawal.id;
  } catch (error) {
    console.error('Error in createAutomaticWithdrawal:', error);
    return null;
  }
}

serve(async (req) => {
  // Gérer CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification (optionnel, peut être appelé par cron)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    
    // Accepter si Authorization header ou x-cron-secret
    if (!authHeader && !cronSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer la configuration
    const config = await getAutoPayoutConfig(supabase);

    if (!config.enabled) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-payout is disabled',
          processed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auto-payout config:', config);

    // Récupérer les stores éligibles
    const eligibleStores = await getEligibleStores(supabase, config);

    if (eligibleStores.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No eligible stores for auto-payout',
          processed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleStores.length} eligible stores`);

    // Traiter chaque store
    const results = [];
    for (const storeEarning of eligibleStores) {
      const store = storeEarning.stores;
      const paymentMethod = store.store_payment_methods?.[0];

      if (!paymentMethod) {
        console.log(`Store ${store.id} has no default payment method, skipping`);
        continue;
      }

      // Montant à reverser (available_balance)
      const amount = parseFloat(storeEarning.available_balance.toString());

      if (amount < config.minAmount) {
        console.log(`Store ${store.id} amount ${amount} < min ${config.minAmount}, skipping`);
        continue;
      }

      // Créer le retrait automatique
      const withdrawalId = await createAutomaticWithdrawal(
        supabase,
        store.id,
        amount,
        paymentMethod.payment_method,
        paymentMethod.payment_details
      );

      if (withdrawalId) {
        results.push({
          store_id: store.id,
          store_name: store.name,
          amount,
          withdrawal_id: withdrawalId,
          success: true,
        });

        // Petite pause entre les créations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        results.push({
          store_id: store.id,
          store_name: store.name,
          amount,
          success: false,
          error: 'Failed to create withdrawal',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${eligibleStores.length} stores`,
        processed: eligibleStores.length,
        successful: successCount,
        failed: errorCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in auto-payout-vendors:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


