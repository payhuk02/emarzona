/**
 * Edge Function — Invalidation cache Redis déclenchée par webhooks DB (products, stores).
 * Auth: x-cache-invalidate-secret OU Authorization Bearer CACHE_INVALIDATION_SECRET
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  purgeRedisByTags,
  resolveEventTags,
  shouldDebounceInvalidate,
} from '../_shared/redis-purge.ts';

interface InvalidatePayload {
  table?: string;
  operation?: string;
  record_id?: string;
  store_id?: string;
  tags?: string[];
  event?: string;
}

function verifyAuth(req: Request): boolean {
  const secret = Deno.env.get('CACHE_INVALIDATION_SECRET');
  if (!secret) return false;

  const headerSecret = req.headers.get('x-cache-invalidate-secret');
  if (headerSecret === secret) return true;

  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;

  return false;
}

serve(async req => {
  const origin = req.headers.get('origin');
  const cors = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  if (!verifyAuth(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: InvalidatePayload = {};
  try {
    body = (await req.json()) as InvalidatePayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const table = body.table ?? 'products';
  const operation = body.operation ?? 'UPDATE';
  const debounceKey = `${table}:${body.record_id ?? 'bulk'}`;

  if (await shouldDebounceInvalidate(debounceKey)) {
    return jsonResponse(
      {
        skipped: true,
        reason: 'debounced',
        table,
        operation,
        timestamp: new Date().toISOString(),
      },
      200,
      origin
    );
  }

  const tags = body.tags?.length ? body.tags : resolveEventTags(table, operation);
  const deleted = await purgeRedisByTags(tags);

  return jsonResponse(
    {
      deleted,
      tags,
      table,
      operation,
      record_id: body.record_id ?? null,
      store_id: body.store_id ?? null,
      redis: deleted > 0 ? 'purged' : 'no_keys_or_unconfigured',
      timestamp: new Date().toISOString(),
    },
    200,
    origin
  );
});
