/**
 * Déclenche les workflows email actifs pour un événement métier (order.paid, etc.)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';
import {
  triggerEmailWorkflowsForEvent,
  type WorkflowContext,
} from '../_shared/workflow-executor.ts';

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
      'authorization, x-client-info, apikey, content-type, x-internal-secret, x-cron-secret',
    Vary: 'Origin',
  };
}

interface TriggerRequest {
  store_id: string;
  event: string;
  context?: WorkflowContext;
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cronSecret = req.headers.get('x-cron-secret');
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedCron = Deno.env.get('CRON_SECRET');
    const expectedInternal = Deno.env.get('EDGE_INTERNAL_SECRET');

    let authorized = false;
    if (expectedCron && cronSecret?.trim() === expectedCron.trim()) authorized = true;
    if (expectedInternal && internalSecret?.trim() === expectedInternal.trim()) authorized = true;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!authorized && token === supabaseKey) authorized = true;
    if (
      !authorized &&
      token &&
      isServiceRoleJwt(token, getProjectRefFromSupabaseUrl(supabaseUrl))
    ) {
      authorized = true;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as TriggerRequest;
    if (!body.store_id || !body.event) {
      return new Response(JSON.stringify({ error: 'store_id and event are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const result = await triggerEmailWorkflowsForEvent(
      supabase,
      body.store_id,
      body.event,
      body.context || {}
    );

    return new Response(
      JSON.stringify({
        success: true,
        event: body.event,
        store_id: body.store_id,
        ...result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('trigger-email-workflows error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
