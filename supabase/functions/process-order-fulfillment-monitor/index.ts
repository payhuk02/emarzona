/**
 * Cron P0 — Monitoring fulfillment post-paiement (SLA 5 min)
 * Auth: x-cron-secret (CRON_SECRET)
 *
 * 1. detect_stale_order_fulfillment RPC
 * 2. Retry edge fulfillment pour commandes sans post_payment_fulfillment_at
 * 3. Enregistre alertes + SLA platform-health (service_key: fulfillment)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';

const STALE_MINUTES = Number(Deno.env.get('FULFILLMENT_SLA_MINUTES') || '5');

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

type StaleOrder = {
  order_id: string;
  order_number?: string;
  store_id?: string;
  paid_at?: string;
  issues: string[];
};

function assertCronAuth(req: Request): Response | null {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), {
      status: 500,
      headers: { ...buildCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  const header = req.headers.get('x-cron-secret');
  if (!header || header.trim() !== cronSecret.trim()) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...buildCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  return null;
}

serve(async req => {
  const corsHeaders = buildCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authError = assertCronAuth(req);
  if (authError) return authError;

  const supabase = createSupabaseAdmin();
  const retries: Array<{ order_id: string; ok: boolean; error?: string }> = [];

  try {
    const { data: detection, error: detectError } = await supabase.rpc(
      'detect_stale_order_fulfillment',
      { p_stale_minutes: STALE_MINUTES }
    );

    if (detectError) {
      throw new Error(`detect_stale_order_fulfillment: ${detectError.message}`);
    }

    const payload = (detection ?? {}) as {
      stale_count?: number;
      orders?: StaleOrder[];
    };

    const staleOrders = Array.isArray(payload.orders) ? payload.orders : [];
    const staleCount = payload.stale_count ?? staleOrders.length;

    for (const order of staleOrders) {
      for (const issue of order.issues ?? []) {
        await supabase.rpc('record_order_fulfillment_alert', {
          p_order_id: order.order_id,
          p_issue_type: issue,
          p_severity:
            issue.includes('missing') || issue.includes('pending') ? 'critical' : 'warning',
          p_detail: {
            order_number: order.order_number,
            paid_at: order.paid_at,
            detected_at: new Date().toISOString(),
          },
        });
      }

      if ((order.issues ?? []).includes('edge_fulfillment_pending')) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('id')
          .eq('order_id', order.order_id)
          .in('status', ['completed', 'paid', 'success'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tx?.id) {
          try {
            await runPostOrderPaymentFulfillment(supabase, order.order_id, tx.id);
            retries.push({ order_id: order.order_id, ok: true });
          } catch (retryErr) {
            const message = retryErr instanceof Error ? retryErr.message : String(retryErr);
            retries.push({ order_id: order.order_id, ok: false, error: message });
            console.error(`Fulfillment retry failed for ${order.order_id}:`, message);
          }
        } else {
          retries.push({
            order_id: order.order_id,
            ok: false,
            error: 'No completed transaction found for retry',
          });
        }
      }
    }

    const slaStatus = staleCount === 0 ? 'operational' : staleCount <= 3 ? 'degraded' : 'outage';

    await supabase.rpc('record_platform_sla_check', {
      p_service_key: 'fulfillment',
      p_service_label: 'Fulfillment commandes',
      p_status: slaStatus,
      p_latency_ms: null,
      p_message:
        staleCount === 0
          ? null
          : `${staleCount} commande(s) payée(s) > ${STALE_MINUTES} min sans fulfillment complet`,
    });

    const { data: autoResolved } = await supabase.rpc('auto_resolve_fulfilled_order_alerts', {
      p_stale_minutes: STALE_MINUTES,
    });

    return new Response(
      JSON.stringify({
        success: true,
        stale_minutes: STALE_MINUTES,
        stale_count: staleCount,
        orders: staleOrders,
        retries_attempted: retries.length,
        retries,
        auto_resolved: autoResolved ?? null,
        sla_status: slaStatus,
      }),
      { status: 200, headers: { ...buildCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('process-order-fulfillment-monitor:', message);

    await supabase.rpc('record_platform_sla_check', {
      p_service_key: 'fulfillment',
      p_service_label: 'Fulfillment commandes',
      p_status: 'outage',
      p_latency_ms: null,
      p_message: message.slice(0, 500),
    });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...buildCorsHeaders(), 'Content-Type': 'application/json' },
    });
  }
});
