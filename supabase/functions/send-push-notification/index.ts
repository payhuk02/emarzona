import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildPushHTTPRequest } from 'npm:@pushforge/builder@2.0.5';
import { resolveVapidPrivateJWK } from '../_shared/vapid-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_ADMIN_CONTACT =
  Deno.env.get('VAPID_SUBJECT') || Deno.env.get('VAPID_ADMIN_CONTACT') || 'mailto:contact@emarzona.com';

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
  silent?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  vibrationIntensity?: string;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  ttl?: number;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function mapUrgency(priority?: string): PushPayload['urgency'] {
  if (priority === 'urgent') return 'high';
  if (priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'normal';
}

async function deliverWebPush(
  privateJWK: JsonWebKey,
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<{ success: boolean; status?: number; error?: string; expired?: boolean }> {
  try {
    const pushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'default',
      silent: payload.silent ?? false,
      requireInteraction: payload.requireInteraction ?? false,
      vibrate: payload.vibrate ?? [200, 100, 200],
      timestamp: Date.now(),
      soundEnabled: payload.soundEnabled ?? !payload.silent,
      vibrationEnabled: payload.vibrationEnabled ?? true,
      vibrationIntensity: payload.vibrationIntensity ?? 'medium',
      unreadCount:
        typeof payload.data?.unreadCount === 'number' ? payload.data.unreadCount : undefined,
      data: {
        ...(payload.data || {}),
        url: payload.url || '/',
        playPlatformSound: true,
        requireInteraction: payload.requireInteraction ?? false,
      },
    };

    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK,
      subscription: {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      message: {
        payload: pushPayload,
        adminContact: VAPID_ADMIN_CONTACT,
        options: {
          ttl: payload.ttl ?? 86400,
          urgency: payload.urgency ?? 'normal',
          topic: payload.tag,
        },
      },
    });

    const response = await fetch(endpoint, { method: 'POST', headers, body });

    if (response.status === 201 || response.status === 200) {
      return { success: true, status: response.status };
    }

    const expired = response.status === 410 || response.status === 404;
    const errorText = await response.text().catch(() => response.statusText);
    return {
      success: false,
      status: response.status,
      error: errorText || `Push service returned ${response.status}`,
      expired,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown push error',
    };
  }
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token || token !== internalSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let privateJWK: JsonWebKey;
    try {
      privateJWK = resolveVapidPrivateJWK(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    } catch (keyError) {
      const message = keyError instanceof Error ? keyError.message : 'Invalid VAPID keys';
      console.error('VAPID key resolution failed:', message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const userId = body.user_id as string | undefined;
    const title = (body.title as string | undefined)?.trim();
    const messageBody = (body.body ?? body.message) as string | undefined;
    const url = (body.url ?? body.data?.url ?? body.data?.action_url) as string | undefined;
    const priority = body.priority as string | undefined;

    if (!userId || !title || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body (or message)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resolvedRequireInteraction =
      body.requireInteraction === true ||
      priority === 'high' ||
      priority === 'urgent' ||
      ['order_payment_received', 'order_payment_failed', 'physical_product_order_placed', 'physical_order_paid', 'physical_order_failed'].includes(
        String(body.tag ?? body.data?.type ?? '')
      );

    const payload: PushPayload = {
      title,
      body: messageBody,
      icon: body.icon,
      badge: body.badge,
      tag: body.tag ?? body.data?.notification_id ?? body.data?.type,
      url: url || '/dashboard',
      data: body.data,
      silent: body.silent,
      requireInteraction: resolvedRequireInteraction,
      vibrate: body.vibrate,
      soundEnabled: body.data?.soundEnabled ?? body.soundEnabled,
      vibrationEnabled: body.data?.vibrationEnabled ?? body.vibrationEnabled,
      vibrationIntensity: body.data?.vibrationIntensity ?? body.vibrationIntensity,
      urgency: body.urgency ?? mapUrgency(priority),
      ttl: body.ttl ?? (resolvedRequireInteraction ? 86400 : undefined),
    };

    const { data: subscriptions, error: subscriptionsError } = await supabase.rpc(
      'get_push_subscriptions_for_user',
      { p_user_id: userId }
    );

    if (subscriptionsError) {
      console.error('Error getting push subscriptions:', subscriptionsError);
      return new Response(JSON.stringify({ error: 'Failed to get push subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No push subscriptions found for user', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (unreadError) {
      console.warn('Could not fetch unread count for push badge:', unreadError.message);
    }

    payload.url = url || '/dashboard';
    payload.data = {
      ...(body.data || {}),
      unreadCount: unreadCount ?? 1,
    };

    const results = [];
    for (const row of subscriptions as PushSubscriptionRow[]) {
      const keys = row.keys;
      if (!keys?.p256dh || !keys?.auth) {
        results.push({
          subscription_id: row.id,
          success: false,
          error: 'Invalid subscription keys',
        });
        continue;
      }

      const result = await deliverWebPush(privateJWK, row, payload);

      if (result.expired) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', row.id);
      }

      await supabase.rpc('log_notification', {
        p_user_id: userId,
        p_type: 'push',
        p_title: title,
        p_body: messageBody,
        p_data: payload.data || {},
        p_channel: 'web-push',
        p_provider: 'vapid',
        p_push_subscription_id: row.id,
        p_status: result.success ? 'sent' : 'failed',
      });

      results.push({
        subscription_id: row.id,
        success: result.success,
        status: result.status,
        error: result.error,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
