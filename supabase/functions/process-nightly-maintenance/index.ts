/**
 * Edge Function: maintenance nocturne groupee (reduit cold starts vs N fonctions separees).
 * Jobs: orphaned-orders, notification-cleanup, email-maintenance
 */

import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';

const DEFAULT_JOBS = ['orphaned-orders', 'notification-cleanup', 'email-maintenance'] as const;
type MaintenanceJob = (typeof DEFAULT_JOBS)[number];

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function parseJobs(url: URL, body: { jobs?: string[] } | null): MaintenanceJob[] {
  const fromQuery = url.searchParams.get('jobs');
  const raw = body?.jobs?.length ? body.jobs : fromQuery ? fromQuery.split(',') : [...DEFAULT_JOBS];

  const allowed = new Set<string>(DEFAULT_JOBS);
  return raw.map(j => j.trim()).filter((j): j is MaintenanceJob => allowed.has(j));
}

async function runOrphanedOrders(
  supabase: ReturnType<typeof createClient>,
  hoursThreshold: number
) {
  const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
    'cleanup_orphaned_multi_store_orders',
    { p_hours_threshold: hoursThreshold }
  );
  if (cleanupError) throw cleanupError;

  const cleanedOrders = cleanupResult?.[0]?.cleaned_orders_count || 0;
  const cleanedOrderItems = cleanupResult?.[0]?.cleaned_order_items_count || 0;
  const cleanedTransactions = cleanupResult?.[0]?.cleaned_transactions_count || 0;

  const { data: incompleteGroupsResult, error: incompleteGroupsError } = await supabase.rpc(
    'check_and_cleanup_incomplete_groups'
  );

  if (incompleteGroupsError) {
    console.error('incomplete groups cleanup error:', incompleteGroupsError);
  }

  const cleanedGroups = incompleteGroupsResult?.[0]?.cleaned_groups_count || 0;
  const totalCleanedFromGroups = incompleteGroupsResult?.[0]?.total_cleaned_orders || 0;

  return {
    orphaned_orders_cleaned: cleanedOrders,
    order_items_cleaned: cleanedOrderItems,
    transactions_cleaned: cleanedTransactions,
    incomplete_groups_cleaned: cleanedGroups,
    total_orders_cleaned: cleanedOrders + totalCleanedFromGroups,
    threshold_hours: hoursThreshold,
  };
}

async function runEmailMaintenance(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc('run_email_maintenance_batch');
  if (error) throw error;
  return data ?? { email_maintenance: true };
}

async function runNotificationCleanup(supabase: ReturnType<typeof createClient>) {
  const { error } = await supabase.rpc('cleanup_notifications_enhanced');
  if (error) throw error;
  return { notifications_cleaned: true };
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authFailure = requireCronOrInternalAuth(req, corsHeaders);
  if (authFailure) return authFailure;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    let body: { jobs?: string[] } | null = null;
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    const jobs = parseJobs(url, body);
    const hoursThreshold = parseInt(url.searchParams.get('hours') || '24', 10);
    const results: Record<string, unknown> = {};

    for (const job of jobs) {
      try {
        if (job === 'orphaned-orders') {
          results[job] = await runOrphanedOrders(supabase, hoursThreshold);
        } else if (job === 'notification-cleanup') {
          results[job] = await runNotificationCleanup(supabase);
        } else if (job === 'email-maintenance') {
          results[job] = await runEmailMaintenance(supabase);
        }
      } catch (error) {
        results[job] = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const failed = Object.values(results).some(
      r => r && typeof r === 'object' && 'success' in r && r.success === false
    );

    return new Response(
      JSON.stringify({
        success: !failed,
        jobs_run: jobs,
        results,
      }),
      {
        status: failed ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('process-nightly-maintenance error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
