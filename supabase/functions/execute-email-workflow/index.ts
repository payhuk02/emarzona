/**
 * Exécute un workflow email par ID (remplace le stub SQL send_email pour l'envoi réel)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';
import { executeEmailWorkflow, type WorkflowContext } from '../_shared/workflow-executor.ts';

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

interface ExecuteRequest {
  workflow_id: string;
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

    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternal = Deno.env.get('EDGE_INTERNAL_SECRET');
    let authorized = false;
    if (expectedInternal && internalSecret?.trim() === expectedInternal.trim()) {
      authorized = true;
    }

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
    if (!authorized && token) {
      const authClient = createClient(supabaseUrl, supabaseKey);
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (!userError && userData.user) authorized = true;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as ExecuteRequest;
    if (!body.workflow_id) {
      return new Response(JSON.stringify({ error: 'workflow_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const success = await executeEmailWorkflow(supabase, body.workflow_id, body.context || {});

    return new Response(JSON.stringify({ success, workflow_id: body.workflow_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
