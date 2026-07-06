/**
 * Resend Webhook Handler — analytics email
 * Vérification Svix (standard Resend) + fallback x-resend-webhook-secret pour tests manuels
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.37.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');
const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    click?: { link?: string };
    bounce?: { message?: string };
  };
}

async function findEmailLog(emailId: string): Promise<{
  id: string;
  metadata: Record<string, unknown>;
  campaign_id: string | null;
} | null> {
  const { data } = await supabase
    .from('email_logs')
    .select('id, metadata, campaign_id')
    .eq('provider_message_id', emailId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    metadata: (data.metadata || {}) as Record<string, unknown>,
    campaign_id: data.campaign_id,
  };
}

async function incrementCampaignMetricFromLog(
  log: { metadata: Record<string, unknown>; campaign_id: string | null } | null,
  metric: string
): Promise<void> {
  const campaignId =
    log?.campaign_id || (log?.metadata?.campaign_id as string | undefined) || undefined;
  if (!campaignId) return;
  await supabase.rpc('increment_campaign_metric', {
    p_campaign_id: campaignId,
    p_metric: metric,
    p_increment: 1,
  });
}

async function processResendEvent(payload: ResendWebhookPayload): Promise<void> {
  const emailId = payload.data?.email_id;
  if (!emailId) return;

  const emailLog = await findEmailLog(emailId);
  const timestamp = payload.created_at || new Date().toISOString();
  const recipientEmail = payload.data.to?.[0];

  const updateData: Record<string, unknown> = {
    updated_at: timestamp,
  };

  switch (payload.type) {
    case 'email.sent':
      updateData.status = 'sent';
      break;
    case 'email.delivered':
      updateData.status = 'delivered';
      await incrementCampaignMetricFromLog(emailLog, 'delivered');
      break;
    case 'email.opened':
      updateData.status = 'opened';
      updateData.opened_at = timestamp;
      await incrementCampaignMetricFromLog(emailLog, 'opened');
      break;
    case 'email.clicked':
      updateData.status = 'clicked';
      updateData.clicked_at = timestamp;
      if (payload.data.click?.link && emailLog?.id) {
        updateData.metadata = {
          ...emailLog.metadata,
          clicked_url: payload.data.click.link,
        };
      }
      await incrementCampaignMetricFromLog(emailLog, 'clicked');
      break;
    case 'email.bounced':
      updateData.status = 'bounced';
      updateData.error_message = payload.data.bounce?.message || 'bounced';
      await incrementCampaignMetricFromLog(emailLog, 'bounced');
      break;
    case 'email.complained':
      updateData.status = 'spam';
      if (recipientEmail) {
        await supabase.from('email_unsubscribes').upsert(
          {
            email: recipientEmail.toLowerCase(),
            unsubscribe_type: 'marketing',
            unsubscribed_at: timestamp,
          },
          { onConflict: 'email,unsubscribe_type' }
        );
      }
      break;
    default:
      return;
  }

  if (emailLog?.id && Object.keys(updateData).length > 1) {
    await supabase.from('email_logs').update(updateData).eq('id', emailLog.id);
  }

  // --- Alerting bounce rate > 5% ---
  if (payload.type === 'email.bounced' || payload.type === 'email.complained') {
    await checkBounceRateAndAlert();
  }
}

/**
 * Calcule le taux de bounce sur les dernières 24h et alerte si > 5%
 * Nécessite un minimum de 50 emails pour éviter les faux positifs.
 */
async function checkBounceRateAndAlert(): Promise<void> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: totalCount } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    const total = totalCount ?? 0;
    if (total < 50) return; // Pas assez de volume pour calculer un taux fiable

    const { count: bounceCount } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .in('status', ['bounced', 'spam']);

    const bounced = bounceCount ?? 0;
    const bounceRate = (bounced / total) * 100;

    if (bounceRate <= 5) return;

    const alertMessage = `🚨 ALERTE EMAIL — Taux de bounce élevé: ${bounceRate.toFixed(2)}% (${bounced}/${total} emails en 24h). Seuil: 5%.`;
    console.error(alertMessage);

    // Persister l'alerte dans les logs
    await supabase.from('email_logs').insert({
      to_email: 'system@emarzona.com',
      subject: 'Alerte: taux de bounce élevé',
      status: 'alert',
      provider_message_id: `alert-bounce-${Date.now()}`,
      error_message: alertMessage,
      metadata: { bounce_rate: bounceRate, bounced, total, alert_type: 'bounce_rate' },
      created_at: new Date().toISOString(),
    });

    // Envoyer vers Slack si configuré
    if (SLACK_WEBHOOK_URL) {
      try {
        await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: alertMessage,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*🚨 Alerte Bounce Rate*\n\n• Taux: *${bounceRate.toFixed(2)}%*\n• Bounces: ${bounced} / ${total} emails (24h)\n• Seuil configuré: 5%`,
                },
              },
            ],
          }),
        });
      } catch (slackErr) {
        console.error('Failed to send Slack alert:', slackErr);
      }
    }
  } catch (err) {
    console.error('checkBounceRateAndAlert error:', err);
  }
}

function parsePayload(rawBody: string, req: Request): ResendWebhookPayload[] {
  const legacyHeader = req.headers.get('x-resend-webhook-secret');
  if (
    legacyHeader &&
    RESEND_WEBHOOK_SECRET &&
    legacyHeader.trim() === RESEND_WEBHOOK_SECRET.trim()
  ) {
    const parsed = JSON.parse(rawBody);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (!RESEND_WEBHOOK_SECRET) {
    throw new Error('RESEND_WEBHOOK_SECRET is not configured');
  }

  const wh = new Webhook(RESEND_WEBHOOK_SECRET);
  const verified = wh.verify(rawBody, {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  }) as ResendWebhookPayload | ResendWebhookPayload[];

  return Array.isArray(verified) ? verified : [verified];
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const events = parsePayload(rawBody, req);

    for (const event of events) {
      try {
        await processResendEvent(event);
      } catch (error) {
        console.error(
          JSON.stringify({
            level: 'error',
            message: 'Resend event processing failed',
            type: event.type,
            email_id: event.data?.email_id,
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    }

    return new Response(JSON.stringify({ processed: events.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('resend-webhook-handler error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
});
