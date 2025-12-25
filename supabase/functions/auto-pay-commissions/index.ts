/**
 * Edge Function: Auto Pay Commissions
 * Date: 1 Février 2025
 * 
 * Description: Paiement automatique des commissions d'affiliation approuvées qui dépassent le seuil minimum
 * 
 * Cron: Tous les jours à 2h du matin (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPayConfig {
  minCommissionAmount: number; // Seuil minimum en XOF (défaut: 50000)
  enabled: boolean; // Activer/désactiver le paiement automatique
}

const DEFAULT_CONFIG: AutoPayConfig = {
  minCommissionAmount: 50000, // 50000 XOF par défaut
  enabled: true,
};

/**
 * Récupère la configuration depuis platform_settings
 */
async function getAutoPayConfig(supabase: any): Promise<AutoPayConfig> {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', 'admin')
      .single();

    if (settings?.settings?.auto_pay_commissions) {
      return { ...DEFAULT_CONFIG, ...settings.settings.auto_pay_commissions };
    }
  } catch (error) {
    console.warn('Could not fetch auto-pay config, using defaults:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Calcule le solde disponible pour un affilié
 */
async function getAffiliateAvailableBalance(
  supabase: any,
  affiliateId: string
): Promise<number> {
  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('pending_commission')
      .eq('id', affiliateId)
      .single();

    return parseFloat(affiliate?.pending_commission || '0');
  } catch (error) {
    console.error('Error fetching affiliate balance:', error);
    return 0;
  }
}

/**
 * Crée un retrait automatique pour un affilié
 */
async function createAutomaticWithdrawal(
  supabase: any,
  affiliateId: string,
  amount: number,
  paymentMethod: string = 'automatic'
): Promise<string | null> {
  try {
    // Récupérer les infos de l'affilié
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('user_id, payment_method, payment_details')
      .eq('id', affiliateId)
      .single();

    if (!affiliate) {
      throw new Error(`Affiliate ${affiliateId} not found`);
    }

    // Créer le retrait
    const { data: withdrawal, error } = await supabase
      .from('affiliate_withdrawals')
      .insert({
        affiliate_id: affiliateId,
        amount: amount,
        payment_method: paymentMethod,
        payment_details: affiliate.payment_details || {},
        status: 'pending', // Admin devra approuver
        notes: 'Paiement automatique - seuil minimum atteint',
        metadata: {
          auto_paid: true,
          created_by: 'auto-pay-commissions',
          created_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    // Mettre à jour le solde de l'affilié (décrémenter pending_commission)
    const { data: currentAffiliate } = await supabase
      .from('affiliates')
      .select('pending_commission')
      .eq('id', affiliateId)
      .single();

    if (currentAffiliate) {
      const newBalance = Math.max(0, parseFloat(currentAffiliate.pending_commission || '0') - amount);
      await supabase
        .from('affiliates')
        .update({
          pending_commission: newBalance,
        })
        .eq('id', affiliateId);
    }

    // Logger
    await supabase.from('transaction_logs').insert({
      event_type: 'auto_commission_withdrawal_created',
      status: 'success',
      request_data: {
        affiliate_id: affiliateId,
        amount,
        withdrawal_id: withdrawal.id,
      },
    });

    return withdrawal.id;
  } catch (error) {
    console.error('Error creating automatic withdrawal:', error);
    await supabase.from('transaction_logs').insert({
      event_type: 'auto_commission_withdrawal_error',
      status: 'failed',
      error_data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        affiliate_id: affiliateId,
        amount,
      },
    });
    return null;
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

    console.log('💰 Starting automatic commission payment job...');

    // Récupérer la configuration
    const config = await getAutoPayConfig(supabase);

    if (!config.enabled) {
      console.log('⏸️  Auto-pay commissions is disabled');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Auto-pay commissions is disabled',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les affiliés avec commissions approuvées >= seuil minimum
    const { data: affiliates, error: fetchError } = await supabase
      .from('affiliates')
      .select('id, user_id, pending_commission, payment_method, payment_details')
      .gte('pending_commission', config.minCommissionAmount)
      .order('pending_commission', { ascending: false });

    if (fetchError) {
      throw new Error(`Error fetching affiliates: ${fetchError.message}`);
    }

    if (!affiliates || affiliates.length === 0) {
      console.log('✅ No affiliates eligible for auto-pay');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No affiliates eligible for auto-pay',
          processed: 0,
          threshold: config.minCommissionAmount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${affiliates.length} affiliates eligible for auto-pay`);

    let processed = 0;
    let created = 0;
    let failed = 0;
    const results: Array<{ affiliate_id: string; amount: number; withdrawal_id: string | null; status: string }> = [];

    for (const affiliate of affiliates) {
      const availableBalance = parseFloat(affiliate.pending_commission || '0');

      if (availableBalance < config.minCommissionAmount) {
        console.log(`⏭️  Skipping affiliate ${affiliate.id}: balance ${availableBalance} < threshold ${config.minCommissionAmount}`);
        continue;
      }

      processed++;

      console.log(`💳 Processing auto-pay for affiliate ${affiliate.id} (${availableBalance} XOF)...`);

      // Créer le retrait automatique
      const withdrawalId = await createAutomaticWithdrawal(
        supabase,
        affiliate.id,
        availableBalance,
        affiliate.payment_method || 'automatic'
      );

      if (withdrawalId) {
        created++;
        results.push({
          affiliate_id: affiliate.id,
          amount: availableBalance,
          withdrawal_id: withdrawalId,
          status: 'created',
        });
        console.log(`✅ Created withdrawal ${withdrawalId} for affiliate ${affiliate.id}`);
      } else {
        failed++;
        results.push({
          affiliate_id: affiliate.id,
          amount: availableBalance,
          withdrawal_id: null,
          status: 'failed',
        });
        console.log(`❌ Failed to create withdrawal for affiliate ${affiliate.id}`);
      }

      // Petite pause pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      success: true,
      message: 'Auto-pay commission job completed',
      config: {
        minCommissionAmount: config.minCommissionAmount,
        enabled: config.enabled,
      },
      stats: {
        total_eligible: affiliates.length,
        processed: processed,
        created: created,
        failed: failed,
      },
      results: results.slice(0, 10), // Limiter les résultats pour la réponse
    };

    console.log('✅ Auto-pay commission job completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in auto-pay commission job:', error);
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

