/// <reference path="../deno.d.ts" />
/**
 * MoneyFusion ops (léger) — verify / reconcile via sync-lite (sans fulfillment lourd).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { syncMoneyFusionLite } from '../_shared/moneyfusion-sync-lite.ts';
import { handleMoneyFusionStoreWithdrawalPayout } from '../_shared/handle-moneyfusion-store-withdrawal.ts';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  if (
    origin &&
    (origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.includes('localhost'))
  ) {
    return origin;
  }
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (
        host === 'www.emarzona.com' ||
        host === 'emarzona.com' ||
        host.endsWith('.emarzona.com') ||
        host.endsWith('.myemarzona.shop')
      ) {
        return origin;
      }
    } catch {
      /* ignore */
    }
  }
  return SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
}

function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-checkout-token, x-cron-secret, x-internal-secret, prefer, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Configuration serveur incomplete' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action, data } = body as { action?: string; data?: unknown };

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action manquante' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'ping') {
      return new Response(JSON.stringify({ success: true, service: 'moneyfusion-ops' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify_payment' || action === 'reconcile_transaction') {
      if (action === 'reconcile_transaction') {
        const authHeader = req.headers.get('authorization') ?? '';
        const cronSecret = req.headers.get('x-cron-secret')?.trim() ?? '';
        const internalSecret = req.headers.get('x-internal-secret')?.trim() ?? '';
        const expectedCron = (Deno.env.get('CRON_SECRET') || '').trim();
        const expectedInternal = (Deno.env.get('EDGE_INTERNAL_SECRET') || '').trim();
        const serviceKeyHeader = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
        const allowed =
          (expectedCron && cronSecret === expectedCron) ||
          (expectedInternal && internalSecret === expectedInternal) ||
          (serviceKeyHeader && bearer === serviceKeyHeader) ||
          authHeader.startsWith('Bearer ');
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const d = (data || {}) as Record<string, unknown>;
      let token = String(d.paymentId || d.token || d.payment_id || '').trim();
      let transactionIdHint = String(d.transactionId || d.transaction_id || '').trim();
      const orderIdHint = String(d.orderId || d.order_id || '').trim();

      if (!token && transactionIdHint) {
        const { data: txRow } = await supabase
          .from('transactions')
          .select('payment_id')
          .eq('id', transactionIdHint)
          .maybeSingle();
        token = String(txRow?.payment_id || '').trim();
      }

      if (!token && orderIdHint) {
        const { data: txRow } = await supabase
          .from('transactions')
          .select('id, payment_id')
          .eq('order_id', orderIdHint)
          .eq('payment_provider', 'moneyfusion')
          .in('status', ['processing', 'pending', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        token = String(txRow?.payment_id || '').trim();
        if (!transactionIdHint && txRow?.id) {
          transactionIdHint = String(txRow.id);
        }
      }

      if (!token) {
        return new Response(JSON.stringify({ error: 'token requis' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sync = await syncMoneyFusionLite(supabase, token, {
        source: action,
        transactionIdHint: transactionIdHint || undefined,
      });

      if (action === 'reconcile_transaction') {
        return new Response(JSON.stringify({ success: sync.success, sync }), {
          status: sync.success ? 200 : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!sync.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: sync.error || 'sync_failed',
            reason: sync.reason,
            status: sync.status,
            transactionId: sync.transactionId,
            orderId: sync.orderId,
          }),
          {
            status: sync.error === 'payment_validation_failed' ? 400 : 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            statut: sync.status,
            status: sync.status,
            transactionId: sync.transactionId,
            orderId: sync.orderId,
            alreadyCompleted: sync.alreadyCompleted,
            completed: sync.completed,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'payout_store_withdrawal') {
      try {
        const payoutResult = await handleMoneyFusionStoreWithdrawalPayout(
          supabase,
          req.headers.get('Authorization'),
          (data || {}) as { withdrawalId: string }
        );
        return new Response(JSON.stringify(payoutResult.body), {
          status: payoutResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (payoutErr) {
        const message = payoutErr instanceof Error ? payoutErr.message : String(payoutErr);
        const status =
          message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500;
        return new Response(JSON.stringify({ success: false, error: message }), {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Action non supportée',
        message: 'Actions: ping, verify_payment, reconcile_transaction, payout_store_withdrawal',
        action,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(JSON.stringify({ error: 'Erreur interne Edge Function', message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
