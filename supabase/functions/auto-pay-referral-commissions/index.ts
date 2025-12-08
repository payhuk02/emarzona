/**
 * Edge Function: Auto Pay Referral Commissions
 * Date: 30 Janvier 2025
 * 
 * Description: Paiement automatique des commissions de parrainage qui dépassent le seuil minimum
 * 
 * Cron: Tous les jours à 4h du matin (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPayReferralConfig {
  enabled: boolean;
  minAmount: number; // Montant minimum en XOF (défaut: 50000)
}

const DEFAULT_CONFIG: AutoPayReferralConfig = {
  enabled: false,
  minAmount: 50000,
};

/**
 * Récupère la configuration depuis platform_settings
 */
async function getAutoPayReferralConfig(supabase: any): Promise<AutoPayReferralConfig> {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', 'admin')
      .single();

    if (settings?.settings?.auto_pay_referral_commissions) {
      const config = settings.settings.auto_pay_referral_commissions;
      return {
        enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
        minAmount: config.min_amount ?? DEFAULT_CONFIG.minAmount,
      };
    }
  } catch (error) {
    console.warn('Could not fetch auto-pay-referral config, using defaults:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Récupère les commissions de parrainage éligibles pour paiement automatique
 */
async function getEligibleCommissions(
  supabase: any,
  config: AutoPayReferralConfig
): Promise<any[]> {
  try {
    // Récupérer les commissions avec status 'pending' et montant >= minAmount
    // Grouper par referrer_id pour calculer le total par parrain
    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select(`
        id,
        referrer_id,
        commission_amount,
        status,
        profiles!referrer_id(
          user_id,
          total_referral_earnings
        )
      `)
      .eq('status', 'pending')
      .gte('commission_amount', config.minAmount)
      .order('created_at', { ascending: true })
      .limit(100); // Limiter à 100 commissions par exécution

    if (error) {
      console.error('Error fetching eligible commissions:', error);
      return [];
    }

    // Grouper par referrer_id et calculer le total
    const grouped = new Map<string, any[]>();
    for (const commission of commissions || []) {
      const referrerId = commission.referrer_id;
      if (!grouped.has(referrerId)) {
        grouped.set(referrerId, []);
      }
      grouped.get(referrerId)!.push(commission);
    }

    // Filtrer ceux dont le total >= minAmount
    const eligible: any[] = [];
    for (const [referrerId, comms] of grouped.entries()) {
      const total = comms.reduce((sum, c) => sum + parseFloat(c.commission_amount.toString()), 0);
      if (total >= config.minAmount) {
        eligible.push({
          referrer_id: referrerId,
          commissions: comms,
          total_amount: total,
        });
      }
    }

    return eligible;
  } catch (error) {
    console.error('Error in getEligibleCommissions:', error);
    return [];
  }
}

/**
 * Marque les commissions comme payées
 */
async function markCommissionsAsPaid(
  supabase: any,
  commissionIds: string[],
  referrerId: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Mettre à jour les commissions
    const { error } = await supabase
      .from('referral_commissions')
      .update({
        status: 'paid',
        paid_at: now,
      })
      .in('id', commissionIds)
      .eq('status', 'pending');

    if (error) {
      console.error('Error marking commissions as paid:', error);
      return false;
    }

    // Mettre à jour le profil (total_referral_earnings est déjà mis à jour à la création)
    // On peut juste logger pour audit
    console.log(`Marked ${commissionIds.length} commissions as paid for referrer ${referrerId}`);

    return true;
  } catch (error) {
    console.error('Error in markCommissionsAsPaid:', error);
    return false;
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
    const config = await getAutoPayReferralConfig(supabase);

    if (!config.enabled) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-pay referral commissions is disabled',
          processed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auto-pay referral config:', config);

    // Récupérer les commissions éligibles
    const eligibleGroups = await getEligibleCommissions(supabase, config);

    if (eligibleGroups.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No eligible commissions for auto-pay',
          processed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleGroups.length} eligible referrers`);

    // Traiter chaque groupe de commissions
    const results = [];
    for (const group of eligibleGroups) {
      const commissionIds = group.commissions.map((c: any) => c.id);

      // Marquer les commissions comme payées
      const success = await markCommissionsAsPaid(
        supabase,
        commissionIds,
        group.referrer_id
      );

      if (success) {
        results.push({
          referrer_id: group.referrer_id,
          commission_count: commissionIds.length,
          total_amount: group.total_amount,
          success: true,
        });

        // Petite pause entre les traitements
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        results.push({
          referrer_id: group.referrer_id,
          commission_count: commissionIds.length,
          total_amount: group.total_amount,
          success: false,
          error: 'Failed to mark commissions as paid',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${eligibleGroups.length} referrers`,
        processed: eligibleGroups.length,
        successful: successCount,
        failed: errorCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in auto-pay-referral-commissions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


