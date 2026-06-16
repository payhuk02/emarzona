/**
 * Edge Function — Warm cache URLs critiques.
 * Auth: x-cron-secret | x-cache-invalidate-secret | JWT admin plateforme
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseUserClient } from '../_shared/supabase-admin.ts';
import { verifyAdminPermission } from '../_shared/admin-auth-utils.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';

const WARM_PATHS = [
  '/',
  '/marketplace',
  '/marketplace?type=digital',
  '/marketplace?type=physical',
  '/marketplace?type=service',
  '/marketplace?type=course',
  '/marketplace?type=artist',
];

async function verifyRequestAuth(req: Request): Promise<{ ok: boolean; via: string }> {
  const cacheSecret = Deno.env.get('CACHE_INVALIDATION_SECRET');
  const cronSecret = Deno.env.get('CRON_SECRET') || Deno.env.get('x-cron-secret');

  const cacheHeader = req.headers.get('x-cache-invalidate-secret');
  if (cacheSecret && cacheHeader === cacheSecret) return { ok: true, via: 'cache-secret' };

  const cronHeader = req.headers.get('x-cron-secret');
  if (cronSecret && cronHeader === cronSecret) return { ok: true, via: 'cron-secret' };

  const auth = req.headers.get('authorization') || '';
  if (cacheSecret && auth === `Bearer ${cacheSecret}`) return { ok: true, via: 'bearer-cache' };

  const supabase = createSupabaseUserClient(auth);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const isAdmin = await verifyAdminPermission(supabase, user.id, 'platform.manage');
    if (isAdmin) return { ok: true, via: 'admin-jwt' };
  }

  return { ok: false, via: 'none' };
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

  const auth = await verifyRequestAuth(req);
  if (!auth.ok) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const site = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  let paths = WARM_PATHS;

  try {
    const body = (await req.json()) as { paths?: string[] };
    if (body.paths?.length) paths = body.paths;
  } catch {
    /* default paths */
  }

  const start = Date.now();
  const results: Array<{ path: string; success: boolean; status?: number; durationMs: number }> =
    [];

  for (const path of paths) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${site}${path}`, {
        headers: { 'User-Agent': 'EmarzonaCacheWarmer/1.0' },
      });
      results.push({
        path,
        success: res.ok,
        status: res.status,
        durationMs: Date.now() - t0,
      });
    } catch {
      results.push({ path, success: false, durationMs: Date.now() - t0 });
    }
  }

  const succeeded = results.filter(r => r.success).length;

  return jsonResponse(
    {
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      durationMs: Date.now() - start,
      auth: auth.via,
      results,
      timestamp: new Date().toISOString(),
    },
    200,
    origin
  );
});
