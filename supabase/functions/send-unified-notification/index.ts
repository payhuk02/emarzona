/**
 * Point d'entrée unifié pour notifications multi-canal (in_app + email).
 * Délègue l'email à send-notification-email.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';
import type { NotificationEmailPayload } from '../_shared/notification-email-utils.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function buildCorsHeaders(originHeader: string | null) {
  const origin =
    originHeader && allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface UnifiedNotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  store_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  language?: string;
  channels?: string[];
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authFailure = requireCronOrInternalAuth(req, corsHeaders);
  if (authFailure) return authFailure;

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
    const payload = (await req.json()) as UnifiedNotificationPayload;

    if (!payload.user_id || !payload.title || !payload.message) {
      return new Response(JSON.stringify({ error: 'user_id, title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const channels = payload.channels?.length
      ? payload.channels
      : ['in_app', 'email'];

    const results: Record<string, unknown> = {};

    if (channels.includes('in_app')) {
      const { data: inAppRow, error: inAppError } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata ?? {},
          action_url: payload.action_url,
          action_label: payload.action_label,
          priority: payload.priority || 'medium',
          is_read: false,
        })
        .select('id')
        .single();

      if (inAppError) {
        results.in_app = { success: false, error: inAppError.message };
      } else {
        results.in_app = { success: true, id: inAppRow?.id };
      }
    }

    if (channels.includes('email')) {
      const emailPayload: NotificationEmailPayload = {
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        action_url: payload.action_url,
        action_label: payload.action_label,
        metadata: payload.metadata,
        store_id: payload.store_id,
        recipient_email: payload.recipient_email,
        recipient_name: payload.recipient_name,
        language: payload.language,
      };

      const invokeHeaders: Record<string, string> = {};
      if (internalSecret) {
        invokeHeaders['x-internal-secret'] = internalSecret;
      }

      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-notification-email',
        { body: emailPayload, headers: invokeHeaders }
      );

      if (emailError) {
        results.email = { success: false, error: emailError.message };
      } else {
        results.email = emailResult;
      }
    }

    const emailOk =
      !channels.includes('email') ||
      (results.email as { success?: boolean; skipped?: boolean })?.success !== false;
    const inAppOk =
      !channels.includes('in_app') ||
      (results.in_app as { success?: boolean })?.success !== false;

    return new Response(
      JSON.stringify({
        success: emailOk && inAppOk,
        channels: results,
      }),
      {
        status: emailOk && inAppOk ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('send-unified-notification error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
