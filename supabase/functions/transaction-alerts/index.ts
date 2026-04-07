/**
 * Edge Function: Transaction Alerts
 * Date: 1 Février 2025
 * 
 * Description: Monitoring et alertes pour les transactions (en attente > 24h, taux d'échec élevé, etc.)
 * 
 * Cron: Toutes les 6 heures (configuré dans Supabase Dashboard)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  pendingThresholdHours: number; // Alerte si transaction en attente > X heures (défaut: 24)
  failureRateThreshold: number; // Alerte si taux d'échec > X% (défaut: 10)
  enabled: boolean;
}

const DEFAULT_CONFIG: AlertConfig = {
  pendingThresholdHours: 24,
  failureRateThreshold: 10, // 10%
  enabled: true,
};

/**
 * Récupère la configuration depuis platform_settings
 */
async function getAlertConfig(supabase: any): Promise<AlertConfig> {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', 'admin')
      .single();

    if (settings?.settings?.transaction_alerts) {
      return { ...DEFAULT_CONFIG, ...settings.settings.transaction_alerts };
    }
  } catch (error) {
    console.warn('Could not fetch alert config, using defaults:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Envoie une alerte (pour l'instant, log dans transaction_logs)
 * TODO: Intégrer avec système d'email/SMS
 */
async function sendAlert(
  supabase: any,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  data: any
): Promise<void> {
  try {
    await supabase.from('transaction_logs').insert({
      event_type: `alert_${alertType}`,
      status: severity,
      request_data: {
        message,
        ...data,
        timestamp: new Date().toISOString(),
      },
      error_data: {
        severity,
        alert_type: alertType,
      },
    });

    console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`, data);
  } catch (error) {
    console.error('Error sending alert:', error);
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

    console.log('🔔 Starting transaction alerts job...');

    // Récupérer la configuration
    const config = await getAlertConfig(supabase);

    if (!config.enabled) {
      console.log('⏸️  Transaction alerts is disabled');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Transaction alerts is disabled',
          alerts: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alerts: Array<{ type: string; severity: string; message: string; count?: number }> = [];

    // 1. Vérifier les transactions en attente > seuil
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - config.pendingThresholdHours);

    const { data: pendingTransactions, error: pendingError } = await supabase
      .from('transactions')
      .select('id, amount, created_at, order_id, payment_provider')
      .eq('status', 'processing')
      .lt('created_at', thresholdDate.toISOString())
      .order('created_at', { ascending: true });

    if (pendingError) {
      console.error('Error fetching pending transactions:', pendingError);
    } else if (pendingTransactions && pendingTransactions.length > 0) {
      const totalAmount = pendingTransactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      
      await sendAlert(
        supabase,
        'pending_transactions',
        pendingTransactions.length > 50 ? 'critical' : pendingTransactions.length > 20 ? 'high' : 'medium',
        `${pendingTransactions.length} transactions en attente depuis plus de ${config.pendingThresholdHours}h`,
        {
          count: pendingTransactions.length,
          total_amount: totalAmount,
          oldest_transaction: pendingTransactions[0]?.created_at,
        }
      );

      alerts.push({
        type: 'pending_transactions',
        severity: pendingTransactions.length > 50 ? 'critical' : pendingTransactions.length > 20 ? 'high' : 'medium',
        message: `${pendingTransactions.length} transactions en attente depuis plus de ${config.pendingThresholdHours}h`,
        count: pendingTransactions.length,
      });
    }

    // 2. Vérifier le taux d'échec sur les dernières 24h
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const { data: recentTransactions, error: recentError } = await supabase
      .from('transactions')
      .select('status')
      .gte('created_at', last24Hours.toISOString());

    if (!recentError && recentTransactions && recentTransactions.length > 0) {
      const total = recentTransactions.length;
      const failed = recentTransactions.filter(t => t.status === 'failed').length;
      const failureRate = (failed / total) * 100;

      if (failureRate > config.failureRateThreshold) {
        await sendAlert(
          supabase,
          'high_failure_rate',
          failureRate > 30 ? 'critical' : failureRate > 20 ? 'high' : 'medium',
          `Taux d'échec élevé: ${failureRate.toFixed(2)}% (${failed}/${total} transactions)`,
          {
            failure_rate: failureRate,
            failed_count: failed,
            total_count: total,
            threshold: config.failureRateThreshold,
          }
        );

        alerts.push({
          type: 'high_failure_rate',
          severity: failureRate > 30 ? 'critical' : failureRate > 20 ? 'high' : 'medium',
          message: `Taux d'échec élevé: ${failureRate.toFixed(2)}% (${failed}/${total} transactions)`,
        });
      }
    }

    // 3. Vérifier les différences de montants détectées (webhook_amount_mismatch)
    const { data: amountMismatches, error: mismatchError } = await supabase
      .from('transaction_logs')
      .select('id, created_at')
      .eq('event_type', 'webhook_amount_mismatch')
      .gte('created_at', last24Hours.toISOString());

    if (!mismatchError && amountMismatches && amountMismatches.length > 0) {
      if (amountMismatches.length > 5) {
        await sendAlert(
          supabase,
          'amount_mismatches',
          amountMismatches.length > 20 ? 'critical' : 'high',
          `${amountMismatches.length} différences de montants détectées dans les dernières 24h`,
          {
            count: amountMismatches.length,
            period: '24h',
          }
        );

        alerts.push({
          type: 'amount_mismatches',
          severity: amountMismatches.length > 20 ? 'critical' : 'high',
          message: `${amountMismatches.length} différences de montants détectées dans les dernières 24h`,
          count: amountMismatches.length,
        });
      }
    }

    const summary = {
      success: true,
      message: 'Transaction alerts job completed',
      config: {
        pendingThresholdHours: config.pendingThresholdHours,
        failureRateThreshold: config.failureRateThreshold,
        enabled: config.enabled,
      },
      alerts: alerts,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Transaction alerts job completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in transaction alerts job:', error);
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

