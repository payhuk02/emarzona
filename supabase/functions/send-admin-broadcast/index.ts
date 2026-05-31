/**
 * Envoi de messages admin (email, notification in-app, popup plateforme)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { authenticateAdminRequest } from '../_shared/admin-auth-utils.ts';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0
      ? '*'
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

type BroadcastChannel = 'email' | 'in_app' | 'popup';
type AudienceType = 'all' | 'vendors' | 'customers' | 'emails';

interface SendAdminBroadcastRequest {
  title: string;
  message: string;
  channels: BroadcastChannel[];
  audience: AudienceType;
  emails?: string[];
  popup_options?: {
    action_url?: string;
    action_label?: string;
    style?: 'info' | 'warning' | 'success' | 'announcement';
    dismissible?: boolean;
    show_once?: boolean;
    starts_at?: string;
    ends_at?: string;
    target_audience?: 'all' | 'authenticated' | 'vendors' | 'customers';
  };
}

interface Recipient {
  user_id: string;
  email: string;
}

function parseEmails(raw?: string[]): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    for (const part of item.split(/[\n,;]+/)) {
      const email = part.trim().toLowerCase();
      if (email.includes('@') && !seen.has(email)) {
        seen.add(email);
        out.push(email);
      }
    }
  }
  return out;
}

async function resolveRecipients(
  supabase: ReturnType<typeof createClient>,
  audience: AudienceType,
  emails?: string[]
): Promise<Recipient[]> {
  if (audience === 'emails') {
    const parsed = parseEmails(emails);
    if (parsed.length === 0) return [];
    const { data, error } = await supabase.rpc('resolve_users_by_emails', { p_emails: parsed });
    if (error) throw new Error(error.message);
    return (data || []) as Recipient[];
  }

  const { data, error } = await supabase.rpc('get_broadcast_recipients', {
    p_audience: audience,
  });
  if (error) throw new Error(error.message);
  return (data || []) as Recipient[];
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const auth = await authenticateAdminRequest(supabase, req, 'emails.manage');
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as SendAdminBroadcastRequest;
    const title = body.title?.trim();
    const message = body.message?.trim();
    const channels = Array.isArray(body.channels) ? body.channels : [];
    const audience = body.audience || 'all';

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (channels.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one channel is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (audience === 'emails' && parseEmails(body.emails).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: broadcast, error: broadcastError } = await supabase
      .from('admin_broadcasts')
      .insert({
        created_by: auth.userId,
        title,
        message,
        channels,
        audience_type: audience,
        audience_filter: audience === 'emails' ? { emails: parseEmails(body.emails) } : {},
        status: 'processing',
      })
      .select('id')
      .single();

    if (broadcastError || !broadcast) {
      throw new Error(broadcastError?.message || 'Failed to create broadcast record');
    }

    let popupId: string | null = null;
    if (channels.includes('popup')) {
      const popupOpts = body.popup_options || {};
      const { data: popup, error: popupError } = await supabase
        .from('platform_popup_messages')
        .insert({
          broadcast_id: broadcast.id,
          title,
          message,
          action_url: popupOpts.action_url || null,
          action_label: popupOpts.action_label || null,
          style: popupOpts.style || 'info',
          target_audience: popupOpts.target_audience || (audience === 'emails' ? 'all' : audience),
          starts_at: popupOpts.starts_at || new Date().toISOString(),
          ends_at: popupOpts.ends_at || null,
          dismissible: popupOpts.dismissible ?? true,
          show_once: popupOpts.show_once ?? true,
          is_active: true,
          created_by: auth.userId,
        })
        .select('id')
        .single();

      if (popupError) throw new Error(popupError.message);
      popupId = popup?.id ?? null;
    }

    const needsRecipients = channels.includes('email') || channels.includes('in_app');
    let recipients: Recipient[] = [];

    if (needsRecipients) {
      recipients = await resolveRecipients(supabase, audience, body.emails);
    }

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const sendHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (internalSecret) {
      sendHeaders['x-internal-secret'] = internalSecret;
    }

    for (const recipient of recipients) {
      let recipientOk = true;

      if (channels.includes('in_app')) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: recipient.user_id,
          type: 'system_announcement',
          title,
          message,
          priority: 'normal',
          metadata: { broadcast_id: broadcast.id, source: 'admin_broadcast' },
        });

        if (notifError) {
          recipientOk = false;
          errors.push(`${recipient.email} (in_app): ${notifError.message}`);
        }
      }

      if (channels.includes('email')) {
        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'send-notification-email',
          {
            body: {
              user_id: recipient.user_id,
              type: 'system_announcement',
              title,
              message,
              recipient_email: recipient.email,
              metadata: { broadcast_id: broadcast.id, source: 'admin_broadcast' },
            },
            headers: sendHeaders,
          }
        );

        const result = sendResult as {
          success?: boolean;
          skipped?: boolean;
          error?: string;
        } | null;
        if (sendError || (result?.success === false && !result?.skipped)) {
          recipientOk = false;
          errors.push(
            `${recipient.email} (email): ${sendError?.message || result?.error || 'send failed'}`
          );
        } else if (result?.skipped) {
          skippedCount++;
        }
      }

      if (recipientOk) {
        sentCount++;
      } else {
        failedCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 80));
    }

    const finalStatus =
      failedCount === 0 ? 'completed' : sentCount === 0 && !popupId ? 'failed' : 'partial';

    await supabase
      .from('admin_broadcasts')
      .update({
        status: finalStatus,
        stats: {
          total: recipients.length,
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
          popup_created: Boolean(popupId),
        },
        error_message: errors.length ? errors.slice(0, 20).join('; ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', broadcast.id);

    return new Response(
      JSON.stringify({
        success: finalStatus !== 'failed',
        broadcast_id: broadcast.id,
        popup_id: popupId,
        stats: {
          total: recipients.length,
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        errors: errors.length ? errors.slice(0, 10) : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('send-admin-broadcast error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
