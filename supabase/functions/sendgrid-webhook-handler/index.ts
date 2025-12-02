/**
 * SendGrid Webhook Handler
 * Edge Function pour recevoir et traiter les webhooks SendGrid
 * Date: 1er Février 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_WEBHOOK_SECRET = Deno.env.get('SENDGRID_WEBHOOK_SECRET'); // Optionnel pour validation

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: 'processed' | 'delivered' | 'deferred' | 'bounce' | 'dropped' | 'open' | 'click' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe';
  sg_event_id: string;
  sg_message_id: string;
  category?: string[];
  campaign_id?: string;
  sequence_id?: string;
  url?: string;
  reason?: string;
  status?: string;
  ip?: string;
  useragent?: string;
  custom_args?: {
    email_log_id?: string;
    campaign_id?: string;
    sequence_id?: string;
    user_id?: string;
  };
}

serve(async (req) => {
  try {
    const { method } = req;

    if (method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Récupérer les événements SendGrid
    const events: SendGridEvent[] = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${events.length} SendGrid events...`);

    // Traiter chaque événement
    for (const event of events) {
      try {
        await processSendGridEvent(event);
      } catch (error) {
        console.error(`Error processing event ${event.sg_event_id}:`, error);
        // Continue avec les autres événements même si un échoue
      }
    }

    return new Response(JSON.stringify({ message: `Successfully processed ${events.length} events` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Global error in sendgrid-webhook-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function processSendGridEvent(event: SendGridEvent): Promise<void> {
  const {
    email,
    timestamp,
    event: eventType,
    sg_event_id,
    sg_message_id,
    category,
    campaign_id,
    sequence_id,
    url,
    reason,
    status,
    ip,
    useragent,
    custom_args,
  } = event;

  // Trouver l'email_log correspondant
  let emailLogId: string | undefined = custom_args?.email_log_id;

  if (!emailLogId) {
    // Essayer de trouver par sg_message_id
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('sendgrid_message_id', sg_message_id)
      .single();

    if (emailLog) {
      emailLogId = emailLog.id;
    }
  }

  // Mettre à jour l'email_log selon le type d'événement
  if (emailLogId) {
    const updateData: Record<string, any> = {
      updated_at: new Date(timestamp * 1000).toISOString(),
    };

    switch (eventType) {
      case 'processed':
        updateData.sendgrid_status = 'queued';
        break;
      case 'delivered':
        updateData.sendgrid_status = 'delivered';
        updateData.delivered_at = new Date(timestamp * 1000).toISOString();
        break;
      case 'open':
        updateData.opened_at = new Date(timestamp * 1000).toISOString();
        updateData.opened_ip = ip;
        break;
      case 'click':
        updateData.clicked_at = new Date(timestamp * 1000).toISOString();
        updateData.clicked_url = url;
        updateData.clicked_ip = ip;
        break;
      case 'bounce':
        updateData.sendgrid_status = 'bounced';
        updateData.bounced_at = new Date(timestamp * 1000).toISOString();
        updateData.bounce_reason = reason || status;
        break;
      case 'dropped':
        updateData.sendgrid_status = 'failed';
        updateData.bounced_at = new Date(timestamp * 1000).toISOString();
        updateData.bounce_reason = reason || status;
        break;
      case 'spamreport':
        updateData.sendgrid_status = 'spam';
        break;
      case 'unsubscribe':
      case 'group_unsubscribe':
        // Enregistrer le désabonnement
        await supabase
          .from('email_unsubscribes')
          .upsert({
            email: email.toLowerCase(),
            unsubscribe_type: 'marketing',
            unsubscribed_at: new Date(timestamp * 1000).toISOString(),
            campaign_id: campaign_id || custom_args?.campaign_id || null,
            ip_address: ip,
            user_agent: useragent,
          }, {
            onConflict: 'email,unsubscribe_type',
          });
        break;
    }

    // Mettre à jour l'email_log
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('email_logs')
        .update(updateData)
        .eq('id', emailLogId);
    }
  }

  // Mettre à jour les métriques de campagne si applicable
  if (campaign_id || custom_args?.campaign_id) {
    const actualCampaignId = campaign_id || custom_args?.campaign_id;
    await updateCampaignMetrics(actualCampaignId, eventType, emailLogId);
  }

  // Mettre à jour les métriques de séquence si applicable
  if (sequence_id || custom_args?.sequence_id) {
    const actualSequenceId = sequence_id || custom_args?.sequence_id;
    await updateSequenceMetrics(actualSequenceId, eventType, emailLogId);
  }

  console.log(`Processed event: ${eventType} for email ${email}`);
}

async function updateCampaignMetrics(
  campaignId: string,
  eventType: string,
  emailLogId?: string
): Promise<void> {
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('metrics')
    .eq('id', campaignId)
    .single();

  if (!campaign) return;

  const metrics = campaign.metrics || {};
  const updates: Record<string, any> = {};

  switch (eventType) {
    case 'delivered':
      updates['metrics.delivered'] = (metrics.delivered || 0) + 1;
      break;
    case 'open':
      updates['metrics.opened'] = (metrics.opened || 0) + 1;
      break;
    case 'click':
      updates['metrics.clicked'] = (metrics.clicked || 0) + 1;
      break;
    case 'bounce':
    case 'dropped':
      updates['metrics.bounced'] = (metrics.bounced || 0) + 1;
      break;
    case 'unsubscribe':
    case 'group_unsubscribe':
      updates['metrics.unsubscribed'] = (metrics.unsubscribed || 0) + 1;
      break;
  }

  if (Object.keys(updates).length > 0) {
    // Utiliser une requête SQL pour incrémenter les métriques
    await supabase.rpc('increment_campaign_metric', {
      p_campaign_id: campaignId,
      p_metric_key: Object.keys(updates)[0],
      p_increment: 1,
    });
  }
}

async function updateSequenceMetrics(
  sequenceId: string,
  eventType: string,
  emailLogId?: string
): Promise<void> {
  // Logique similaire pour les séquences si nécessaire
  console.log(`Updating sequence metrics for ${sequenceId}: ${eventType}`);
}

