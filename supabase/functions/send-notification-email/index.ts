/**
 * Envoi email pour notifications unifiées (service role + templates notification_templates)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { verifyStoreAccess } from '../_shared/email-compliance-utils.ts';
import {
  type NotificationEmailPayload,
  renderNotificationEmail,
  resolveRecipientEmail,
} from '../_shared/notification-email-utils.ts';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';

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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-internal-secret',
    Vary: 'Origin',
  };
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

    let isInternalCall = false;
    let callerUserId = '';

    const headerInternal = req.headers.get('x-internal-secret');
    if (internalSecret && headerInternal?.trim() === internalSecret.trim()) {
      isInternalCall = true;
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!isInternalCall && token && token === supabaseServiceKey) {
      isInternalCall = true;
    }

    const projectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
    if (!isInternalCall && token && isServiceRoleJwt(token, projectRef)) {
      isInternalCall = true;
    }

    if (!isInternalCall && token) {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData.user) {
        callerUserId = userData.user.id;
      }
    }

    if (!isInternalCall && !callerUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as NotificationEmailPayload;

    if (!payload.user_id || !payload.title) {
      return new Response(JSON.stringify({ error: 'user_id and title are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isInternalCall && callerUserId) {
      const selfOnly = callerUserId === payload.user_id;
      const storeId = payload.store_id || (payload.metadata?.store_id as string | undefined);
      const storeAccess = storeId
        ? await verifyStoreAccess(supabase, callerUserId, { storeId })
        : { allowed: false };

      if (!selfOnly && !storeAccess.allowed) {
        return new Response(
          JSON.stringify({ error: 'Not allowed to send notification email to this user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const recipient = await resolveRecipientEmail(
      supabase,
      payload.user_id,
      payload.recipient_email
    );
    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Recipient email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientName = payload.recipient_name || recipient.name || 'Client';
    const { subject, html } = await renderNotificationEmail(supabase, payload, recipientName);

    const sendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (internalSecret) {
      sendHeaders['x-internal-secret'] = internalSecret;
    }

    const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipient.email,
        toName: recipientName,
        subject,
        html,
        userId: payload.user_id,
        storeId: payload.store_id || (payload.metadata?.store_id as string | undefined),
        variables: {
          title: payload.title,
          message: payload.message,
          notification_type: payload.type,
        },
      },
      headers: sendHeaders,
    });

    if (sendError) {
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = sendResult as {
      success?: boolean;
      skipped?: boolean;
      messageId?: string;
      error?: string;
    } | null;

    if (result?.success === false && !result?.skipped) {
      return new Response(JSON.stringify({ error: result.error || 'send-email failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        skipped: result?.skipped ?? false,
        messageId: result?.messageId,
        to: recipient.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('send-notification-email error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
