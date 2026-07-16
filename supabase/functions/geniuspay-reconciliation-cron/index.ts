/**
 * Cron quotidien : réconciliation GeniusPay vs transactions DB (Epic 2.3.6)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';

const GENIUSPAY_API_URL = Deno.env.get('GENIUSPAY_API_URL') || 'https://geniuspay.ci/api/v1/merchant';

interface ReconTarget {
  transaction_id: string;
  geniuspay_transaction_id: string;
  status: string;
  amount: number | string;
  currency: string;
  store_id: string;
}

function mapGeniusPayStatus(geniuspayStatus: string): string {
  const map: Record<string, string> = {
    completed: 'completed',
    success: 'completed',
    failed: 'failed',
    pending: 'processing',
    processing: 'processing',
    cancelled: 'cancelled',
    refunded: 'refunded',
  };
  return map[geniuspayStatus?.toLowerCase()] || 'processing';
}

async function fetchGeniusPayPayment(
  apiKey: string,
  paymentId: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GENIUSPAY_API_URL}/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`GeniusPay API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

serve(async req => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = requireCronOrInternalAuth(req, corsHeaders);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const geniuspayApiKey = Deno.env.get('GENIUSPAY_API_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geniuspayApiKey) {
      return new Response(JSON.stringify({ error: 'GENIUSPAY_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const hoursBack = Number((body as { hours_back?: number }).hours_back ?? 48);

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: runId, error: startError } = await supabase.rpc(
      'start_geniuspay_reconciliation_run',
      {
        p_hours_back: hoursBack,
      }
    );
    if (startError || !runId) {
      throw new Error(startError?.message ?? 'Failed to start reconciliation run');
    }

    const { data: rawTargets, error: listError } = await supabase.rpc(
      'list_geniuspay_transactions_for_reconciliation',
      { p_hours_back: hoursBack, p_limit: 200 }
    );
    if (listError) {
      throw new Error(listError.message);
    }

    const targets = (rawTargets ?? []) as ReconTarget[];
    let errors = 0;

    for (const target of targets) {
      try {
        const payment = await fetchGeniusPayPayment(geniuspayApiKey, target.geniuspay_transaction_id);
        const paymentData = (payment.data ?? payment) as Record<string, unknown>;

        const dbAmount = Number(target.amount);
        const geniuspayAmount = Number(paymentData.amount ?? 0);
        const dbStatus = target.status;
        const geniuspayStatus = mapGeniusPayStatus(String(paymentData.status ?? ''));

        const amountMismatch = Math.abs(dbAmount - geniuspayAmount) > 0.01;
        const statusMismatch = dbStatus !== geniuspayStatus && dbStatus !== 'partially_refunded';

        const matched = !amountMismatch && !statusMismatch;

        await supabase.rpc('record_geniuspay_reconciliation_result', {
          p_run_id: runId,
          p_transaction_id: target.transaction_id,
          p_geniuspay_transaction_id: target.geniuspay_transaction_id,
          p_matched: matched,
          p_discrepancy_type: amountMismatch ? 'amount' : statusMismatch ? 'status' : null,
          p_db_value: { amount: dbAmount, status: dbStatus, currency: target.currency },
          p_geniuspay_value: {
            amount: geniuspayAmount,
            status: geniuspayStatus,
            currency: paymentData.currency,
          },
        });

        if (!matched) {
          console.warn('Reconciliation mismatch:', target.transaction_id, {
            dbAmount,
            geniuspayAmount,
            dbStatus,
            geniuspayStatus,
          });
        }
      } catch (rowError) {
        errors++;
        console.error('Reconciliation row error:', target.transaction_id, rowError);
      }

      await new Promise(r => setTimeout(r, 150));
    }

    await supabase.rpc('finish_geniuspay_reconciliation_run', {
      p_run_id: runId,
      p_errors: errors,
      p_metadata: { hours_back: hoursBack, targets: targets.length },
    });

    const summary = {
      success: true,
      run_id: runId,
      total_targets: targets.length,
      errors,
      processed_at: new Date().toISOString(),
    };

    console.log('GeniusPay reconciliation completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('geniuspay-reconciliation-cron error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
