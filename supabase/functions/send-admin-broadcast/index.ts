/**
 * Envoi de messages admin (email, notification in-app, popup plateforme)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  buildAudienceFilter,
  createBroadcastPopup,
  parseEmails,
  processBroadcastDelivery,
  resolveBroadcastPlainMessage,
  resolveRecipients,
  type BroadcastChannel,
  type BroadcastPayload,
  type BroadcastPriority,
  type AudienceType,
} from '../_shared/admin-broadcast-processor.ts';
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

interface SendAdminBroadcastRequest extends BroadcastPayload {
  scheduled_at?: string;
  test_mode?: boolean;
  test_email?: string;
  preview_only?: boolean;
  popup_options?: BroadcastPayload['popup_options'];
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    const messageHtml = body.message_html?.trim();
    const emailDesign = body.email_design || 'premium';
    const message = resolveBroadcastPlainMessage({
      title: title || '',
      message: body.message?.trim() || '',
      message_html: messageHtml,
      channels: [],
      audience: 'all',
    });
    const channels = Array.isArray(body.channels) ? body.channels : [];
    const audience = body.audience || 'all';
    const priority = (body.priority || 'normal') as BroadcastPriority;

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

    const payload: BroadcastPayload = {
      title,
      message,
      message_html: messageHtml || undefined,
      email_design: emailDesign,
      channels: channels as BroadcastChannel[],
      audience: audience as AudienceType,
      emails: body.emails,
      priority,
      action_url: body.action_url,
      action_label: body.action_label,
      popup_options: body.popup_options,
    };

    if (body.preview_only) {
      const needsRecipients = channels.includes('email') || channels.includes('in_app');
      let count = 0;
      if (needsRecipients) {
        const recipients = await resolveRecipients(supabase, audience as AudienceType, body.emails);
        count = recipients.length;
      }
      return new Response(
        JSON.stringify({ success: true, preview: { count, audience, channels } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scheduledAt = body.scheduled_at?.trim();
    const isFutureSchedule = scheduledAt && new Date(scheduledAt).getTime() > Date.now();

    if (body.test_mode) {
      const testEmail = body.test_email?.trim().toLowerCase();
      if (!testEmail?.includes('@')) {
        return new Response(JSON.stringify({ error: 'test_email is required for test mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const testChannels = channels.filter(
        c => c === 'email' || c === 'in_app'
      ) as BroadcastChannel[];
      if (testChannels.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Test mode requires email or in_app channel' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users } = await supabase.rpc('resolve_users_by_emails', {
        p_emails: [testEmail],
      });
      const userRow = ((users || []) as Array<{ user_id: string; email: string }>)[0];

      const { data: broadcast, error: broadcastError } = await supabase
        .from('admin_broadcasts')
        .insert({
          created_by: auth.userId,
          title: `[TEST] ${title}`,
          message,
          message_html: messageHtml || null,
          email_design: emailDesign,
          channels: testChannels,
          audience_type: 'emails',
          audience_filter: { emails: [testEmail], test_mode: true },
          status: 'processing',
          priority,
          action_url: body.action_url || null,
          action_label: body.action_label || null,
        })
        .select('id')
        .single();

      if (broadcastError || !broadcast) {
        throw new Error(broadcastError?.message || 'Failed to create test broadcast');
      }

      const result = await processBroadcastDelivery(
        supabase,
        broadcast.id,
        { ...payload, channels: testChannels, audience: 'emails', emails: [testEmail] },
        [{ email: testEmail, user_id: userRow?.user_id ?? null }]
      );

      const finalStatus = result.success ? 'completed' : 'failed';
      await supabase
        .from('admin_broadcasts')
        .update({
          status: finalStatus,
          stats: { ...result.stats, test_mode: true },
          error_message: result.errors.length ? result.errors.join('; ') : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', broadcast.id);

      return new Response(
        JSON.stringify({
          success: result.success,
          test_mode: true,
          broadcast_id: broadcast.id,
          stats: result.stats,
          errors: result.errors.length ? result.errors : undefined,
          error: result.error,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isFutureSchedule) {
      const { data: broadcast, error: broadcastError } = await supabase
        .from('admin_broadcasts')
        .insert({
          created_by: auth.userId,
          title,
          message,
          message_html: messageHtml || null,
          email_design: emailDesign,
          channels,
          audience_type: audience,
          audience_filter: buildAudienceFilter(audience as AudienceType, body.emails),
          status: 'scheduled',
          scheduled_at: new Date(scheduledAt).toISOString(),
          priority,
          action_url: body.action_url || null,
          action_label: body.action_label || null,
          stats: {},
        })
        .select('id')
        .single();

      if (broadcastError || !broadcast) {
        throw new Error(broadcastError?.message || 'Failed to schedule broadcast');
      }

      let popupId: string | null = null;
      if (channels.includes('popup')) {
        popupId = await createBroadcastPopup(supabase, broadcast.id, payload, auth.userId, {
          active: false,
          startsAt: new Date(scheduledAt).toISOString(),
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          scheduled: true,
          broadcast_id: broadcast.id,
          popup_id: popupId,
          scheduled_at: new Date(scheduledAt).toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: broadcast, error: broadcastError } = await supabase
      .from('admin_broadcasts')
      .insert({
        created_by: auth.userId,
        title,
        message,
        message_html: messageHtml || null,
        email_design: emailDesign,
        channels,
        audience_type: audience,
        audience_filter: buildAudienceFilter(audience as AudienceType, body.emails),
        status: 'processing',
        priority,
        action_url: body.action_url || null,
        action_label: body.action_label || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      .select('id')
      .single();

    if (broadcastError || !broadcast) {
      throw new Error(broadcastError?.message || 'Failed to create broadcast record');
    }

    const popupId = await createBroadcastPopup(supabase, broadcast.id, payload, auth.userId);

    const delivery = await processBroadcastDelivery(supabase, broadcast.id, payload);

    const hasPopupOnly =
      channels.includes('popup') && !channels.includes('email') && !channels.includes('in_app');
    const finalStatus =
      delivery.stats.failed === 0 || hasPopupOnly
        ? 'completed'
        : delivery.stats.sent === 0 && !popupId
          ? 'failed'
          : 'partial';
    const summaryError =
      finalStatus === 'failed'
        ? delivery.errors[0] || "Aucun message n'a pu être envoyé."
        : delivery.errors.length
          ? delivery.errors.slice(0, 3).join('; ')
          : null;

    await supabase
      .from('admin_broadcasts')
      .update({
        status: finalStatus,
        stats: {
          ...delivery.stats,
          popup_created: Boolean(popupId),
        },
        error_message: delivery.errors.length ? delivery.errors.slice(0, 20).join('; ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', broadcast.id);

    return new Response(
      JSON.stringify({
        success: finalStatus !== 'failed',
        error: finalStatus === 'failed' ? summaryError : undefined,
        broadcast_id: broadcast.id,
        popup_id: popupId,
        stats: delivery.stats,
        errors: delivery.errors.length ? delivery.errors.slice(0, 10) : undefined,
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
