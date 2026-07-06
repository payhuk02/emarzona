/**
 * Resend Webhook Handler — analytics email + idempotence Svix
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.37.0';
import {
  buildComplaintUnsubscribeRow,
  buildEmailLogUpdate,
  getCampaignMetricForEvent,
  resolveWebhookDedupKey,
  shouldPersistEmailLogUpdate,
  shouldTriggerBounceRateAlert,
  type EmailLogSnapshot,
  type ResendWebhookPayload,
} from '../_shared/resend-webhook-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');
const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');
const ALLOW_LEGACY_RESEND_WEBHOOK = Deno.env.get('ALLOW_LEGACY_RESEND_WEBHOOK') === 'true';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findEmailLog(emailId: string): Promise<EmailLogSnapshot | null> {
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
  log: EmailLogSnapshot | null,
  metric: string
): Promise<void> {
  const campaignId =
    log?.campaign_id || (log?.metadata?.campaign_id as string | undefined) || undefined;
  if (!campaignId) return;
  await supabase.rpc('increment_campaign_metric', {
    p_campaign_id: campaignId,
    p_metric_key: metric,
    p_increment: 1,
  });
}

async function claimWebhookEvent(
  svixId: string | null,
  event: ResendWebhookPayload
): Promise<boolean> {
  const dedupKey = resolveWebhookDedupKey(svixId, event, {
    allowLegacyComposite: ALLOW_LEGACY_RESEND_WEBHOOK,
  });

  if (!dedupKey) {
    return true;
  }

  const { data, error } = await supabase.rpc('claim_email_webhook_event', {
    p_dedup_key: dedupKey,
    p_event_type: event.type,
    p_provider_message_id: event.data?.email_id ?? null,
  });

  if (error) {
    console.error('claim_email_webhook_event failed:', error.message);
    return false;
  }

  return data === true;
}

async function processResendEvent(payload: ResendWebhookPayload): Promise<void> {
  const emailId = payload.data?.email_id;
  if (!emailId) return;

  const emailLog = await findEmailLog(emailId);
  const updateData = buildEmailLogUpdate(payload, emailLog);

  const metric = getCampaignMetricForEvent(payload.type);
  if (metric) {
    await incrementCampaignMetricFromLog(emailLog, metric);
  }

  const complaintRow = buildComplaintUnsubscribeRow(payload);
  if (complaintRow) {
    await supabase.from('email_unsubscribes').upsert(complaintRow, {
      onConflict: 'email,unsubscribe_type',
    });
  }

  if (emailLog?.id && shouldPersistEmailLogUpdate(updateData)) {
    await supabase.from('email_logs').update(updateData!).eq('id', emailLog.id);
  }

  if (shouldTriggerBounceRateAlert(payload.type)) {
    await checkBounceRateAndAlert();
  }
}

async function checkBounceRateAndAlert(): Promise<void> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: totalCount } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    const total = totalCount ?? 0;
    if (total < 50) return;

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

    await supabase.from('email_logs').insert({
      to_email: 'system@emarzona.com',
      subject: 'Alerte: taux de bounce élevé',
      status: 'alert',
      provider_message_id: `alert-bounce-${Date.now()}`,
      error_message: alertMessage,
      metadata: { bounce_rate: bounceRate, bounced, total, alert_type: 'bounce_rate' },
      created_at: new Date().toISOString(),
    });

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
    ALLOW_LEGACY_RESEND_WEBHOOK &&
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
    const svixId = req.headers.get('svix-id');

    let processed = 0;
    let skippedDuplicates = 0;

    for (const event of events) {
      try {
        const claimed = await claimWebhookEvent(svixId, event);
        if (!claimed) {
          skippedDuplicates += 1;
          continue;
        }

        await processResendEvent(event);
        processed += 1;
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

    return new Response(
      JSON.stringify({
        processed,
        skipped_duplicates: skippedDuplicates,
        total: events.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('resend-webhook-handler error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
});
