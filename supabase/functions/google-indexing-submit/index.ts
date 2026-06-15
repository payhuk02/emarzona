/**
 * Epic 5.2 — Worker Google Indexing API (cron CRON_SECRET)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  getGoogleIndexingAccessToken,
  parseGoogleServiceAccountJson,
  submitGoogleIndexingUrl,
} from '../_shared/google-indexing-api.ts';

const CRON_SECRET = Deno.env.get('CRON_SECRET');

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const cronHeader = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || (cronHeader !== CRON_SECRET && authHeader !== CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const serviceAccount = parseGoogleServiceAccountJson(
    Deno.env.get('GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON')
  );
  if (!serviceAccount) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createSupabaseAdmin();
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'process';

  if (action === 'enqueue-sitemaps') {
    const limit = Number(url.searchParams.get('limit') ?? '200');
    const { data, error } = await supabase.rpc('enqueue_active_store_sitemaps', {
      p_limit: limit,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ enqueued: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleIndexingAccessToken(serviceAccount);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const batchLimit = Number(url.searchParams.get('limit') ?? '25');
  const { data: batch, error: claimError } = await supabase.rpc('claim_google_indexing_batch', {
    p_limit: batchLimit,
  });

  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = (batch ?? []) as Array<{
    id: string;
    url: string;
    url_type: 'URL_UPDATED' | 'URL_DELETED';
  }>;

  const results: Array<{ id: string; ok: boolean; status?: number }> = [];

  for (const row of rows) {
    const result = await submitGoogleIndexingUrl(accessToken, row.url, row.url_type);
    await supabase.rpc('complete_google_indexing', {
      p_id: row.id,
      p_success: result.ok,
      p_error: result.ok ? null : JSON.stringify(result.body),
      p_response: result.body as Record<string, unknown>,
    });
    results.push({ id: row.id, ok: result.ok, status: result.status });
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      success: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
