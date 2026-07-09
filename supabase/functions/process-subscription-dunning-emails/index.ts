/**
 * Cron : emails dunning abonnement produits physiques
 * (J-7, J-1, past_due, J+3, J+7, expired, checkout auto-renouvellement)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';

const SITE_URL = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');

interface DunningEmailTarget {
  subscription_id: string;
  store_id: string;
  owner_user_id: string;
  dunning_type: string;
  email_type: string;
  plan_name: string;
  current_period_end: string;
  amount: number | string;
  currency: string;
  checkout_url?: string | null;
}

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function formatPeriodEnd(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('fr-FR');
}

function buildEmailPayload(target: DunningEmailTarget, billingUrl: string) {
  const periodEnd = formatPeriodEnd(target.current_period_end);
  const amount = formatAmount(target.amount);
  const actionUrl =
    target.checkout_url && target.dunning_type === 'auto_renew' ? target.checkout_url : billingUrl;

  const titles: Record<string, string> = {
    'j-7': 'Renouvellement dans 7 jours',
    'j-1': 'Votre abonnement expire demain',
    past_due: 'Paiement en retard',
    'j+3': '3 jours sans paiement',
    'j+7': 'Dernier jour de grâce',
    expired: 'Abonnement expiré — produits suspendus',
    auto_renew: 'Confirmez votre renouvellement Moneroo',
  };

  const messages: Record<string, string> = {
    'j-7':
      'Le renouvellement automatique sera initié si votre profil Moneroo est enregistré. Sinon, régularisez depuis votre espace facturation.',
    'j-1': 'Dernière chance avant suspension de vos produits physiques.',
    past_due: 'Vos produits physiques seront suspendus si le paiement n’est pas reçu sous 7 jours.',
    'j+3':
      'Votre abonnement est en retard depuis 3 jours. Régularisez avant la fin de la période de grâce.',
    'j+7':
      'C’est le dernier jour de grâce. Sans paiement aujourd’hui, vos produits seront suspendus demain.',
    expired:
      'Vos produits physiques sont suspendus. Réactivez votre abonnement pour reprendre les ventes.',
    auto_renew:
      'Un checkout Moneroo a été préparé avec votre profil enregistré. Une confirmation mobile money suffit.',
  };

  const actionLabels: Record<string, string> = {
    'j-7': 'Gérer la facturation',
    'j-1': 'Renouveler maintenant',
    past_due: 'Régulariser le paiement',
    'j+3': 'Régulariser le paiement',
    'j+7': 'Payer maintenant',
    expired: 'Réactiver mon abonnement',
    auto_renew: 'Confirmer sur Moneroo',
  };

  return {
    user_id: target.owner_user_id,
    type: target.email_type,
    title: titles[target.dunning_type] ?? 'Abonnement Emarzona',
    message: messages[target.dunning_type] ?? '',
    action_url: actionUrl,
    action_label: actionLabels[target.dunning_type] ?? 'Ouvrir',
    store_id: target.store_id,
    language: 'fr',
    metadata: {
      store_id: target.store_id,
      plan_name: target.plan_name,
      period_end: periodEnd,
      amount,
      currency: target.currency,
      dunning_type: target.dunning_type,
      subscription_id: target.subscription_id,
    },
  };
}

serve(async req => {
  const corsHeaders = buildCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireCronOrInternalAuth(req, corsHeaders);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET') ?? '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const billingUrl = `${SITE_URL}/dashboard/billing/physical`;

    const { data: rawTargets, error: listError } = await supabase.rpc(
      'list_subscription_dunning_email_targets'
    );

    if (listError) {
      throw new Error(`list_subscription_dunning_email_targets: ${listError.message}`);
    }

    const targets = (rawTargets ?? []) as DunningEmailTarget[];

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No dunning emails to send',
          sent: 0,
          failed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sendHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (internalSecret) sendHeaders['x-internal-secret'] = internalSecret;

    let sent = 0;
    let failed = 0;
    const results: Array<{
      subscription_id: string;
      dunning_type: string;
      status: string;
      error?: string;
    }> = [];

    for (const target of targets) {
      try {
        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'send-notification-email',
          {
            body: buildEmailPayload(target, billingUrl),
            headers: sendHeaders,
          }
        );

        if (sendError) {
          throw new Error(sendError.message);
        }

        const result = sendResult as {
          success?: boolean;
          skipped?: boolean;
          error?: string;
        } | null;
        if (result?.success === false && !result?.skipped) {
          throw new Error(result.error || 'send-notification-email failed');
        }

        const { error: markError } = await supabase.rpc('mark_subscription_dunning_email_sent', {
          p_subscription_id: target.subscription_id,
          p_dunning_type: target.dunning_type,
        });

        if (markError) {
          console.warn('Failed to mark dunning email sent:', markError.message);
        }

        sent++;
        results.push({
          subscription_id: target.subscription_id,
          dunning_type: target.dunning_type,
          status: result?.skipped ? 'skipped' : 'sent',
        });
      } catch (rowError: unknown) {
        const message = rowError instanceof Error ? rowError.message : String(rowError);
        failed++;
        results.push({
          subscription_id: target.subscription_id,
          dunning_type: target.dunning_type,
          status: 'failed',
          error: message,
        });
        console.error('Dunning email failed:', target.subscription_id, message);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const summary = {
      success: true,
      message: 'Subscription dunning email job completed',
      total_targets: targets.length,
      sent,
      failed,
      results: results.slice(0, 30),
      processed_at: new Date().toISOString(),
    };

    console.log('Dunning email job completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('process-subscription-dunning-emails error:', message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
