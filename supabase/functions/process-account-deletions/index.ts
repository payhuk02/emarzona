/**
 * Cron RGPD — Traitement automatique des demandes de suppression de compte
 * Après période de grâce : anonymisation PII → suppression auth.users
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireCronOrInternalAuth } from '../_shared/edge-auth-utils.ts';

const SITE_URL = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');

interface DeletionTarget {
  request_id: string;
  user_id: string;
  user_email: string;
  requested_at: string;
  requires_manual_review: boolean;
  manual_review_reason: string | null;
}

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': SITE_URL,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function parseGraceDays(): number {
  const raw = Deno.env.get('GDPR_DELETION_GRACE_DAYS');
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(7, Math.min(90, parsed));
}

function parseBatchLimit(url: URL): number {
  const parsed = parseInt(url.searchParams.get('limit') || '10', 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(50, parsed));
}

serve(async req => {
  const corsHeaders = buildCorsHeaders();

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
    const graceDays = parseGraceDays();
    const batchLimit = parseBatchLimit(url);

    console.log(`GDPR account deletion cron — grace_days=${graceDays}, batch_limit=${batchLimit}`);

    const { data: targets, error: listError } = await supabase.rpc(
      'list_pending_account_deletion_targets',
      { p_grace_days: graceDays, p_batch_limit: batchLimit }
    );

    if (listError) {
      console.error('list_pending_account_deletion_targets failed:', listError);
      throw listError;
    }

    const rows = (targets ?? []) as DeletionTarget[];
    const results: Array<Record<string, unknown>> = [];

    for (const target of rows) {
      if (target.requires_manual_review) {
        await supabase.rpc('flag_account_deletion_manual_review', {
          p_request_id: target.request_id,
          p_reason: target.manual_review_reason ?? 'manual_review_required',
        });
        results.push({
          request_id: target.request_id,
          user_id: target.user_id,
          status: 'manual_review',
          reason: target.manual_review_reason,
        });
        continue;
      }

      const { data: marked, error: markError } = await supabase.rpc(
        'mark_account_deletion_processing',
        { p_request_id: target.request_id }
      );

      if (markError || !marked) {
        console.error('mark_account_deletion_processing failed:', markError);
        results.push({
          request_id: target.request_id,
          user_id: target.user_id,
          status: 'skipped',
          error: markError?.message ?? 'already_processing',
        });
        continue;
      }

      try {
        const { data: anonymizeSummary, error: anonymizeError } = await supabase.rpc(
          'anonymize_user_pii_for_deletion',
          { p_user_id: target.user_id }
        );

        if (anonymizeError) {
          throw anonymizeError;
        }

        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(target.user_id);

        if (deleteAuthError) {
          throw deleteAuthError;
        }

        await supabase.rpc('complete_account_deletion_request', {
          p_request_id: target.request_id,
          p_summary: {
            anonymize: anonymizeSummary,
            auth_deleted: true,
            email: target.user_email,
          },
        });

        results.push({
          request_id: target.request_id,
          user_id: target.user_id,
          status: 'completed',
          anonymize: anonymizeSummary,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Deletion failed for ${target.user_id}:`, message);
        await supabase.rpc('fail_account_deletion_request', {
          p_request_id: target.request_id,
          p_error: message,
        });
        results.push({
          request_id: target.request_id,
          user_id: target.user_id,
          status: 'failed',
          error: message,
        });
      }
    }

    const summary = {
      processed: results.filter(r => r.status === 'completed').length,
      manual_review: results.filter(r => r.status === 'manual_review').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      total_candidates: rows.length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        grace_days: graceDays,
        batch_limit: batchLimit,
        summary,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('process-account-deletions error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
