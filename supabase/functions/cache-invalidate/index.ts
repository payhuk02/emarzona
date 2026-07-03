import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';

// Edge Function pour purger le cache CDN Vercel ou Cloudflare
// via l'API On-Demand Revalidation.
serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 1. Validation Service Role / Internal Secret
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '').trim();
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');

    if (token !== serviceRoleKey && token !== internalSecret) {
      throw new Error('Unauthorized: Invalid token');
    }

    const { tag, table } = await req.json();
    if (!tag) throw new Error('Missing cache tag');

    // 2. Appel à l'API de purge de Vercel (exemple)
    const vercelToken = Deno.env.get('VERCEL_ACCESS_TOKEN');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');

    if (vercelToken && vercelProjectId) {
      // Pour In-Demand Revalidation (Data Cache / Vercel KV)
      console.log(`[Cache Invalidate] Purging tag: ${tag} for table: ${table}`);

      const purgeReq = await fetch(
        `https://api.vercel.com/v1/edge-config/${vercelProjectId}/items`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                operation: 'update',
                key: `last_invalidated_${tag}`,
                value: Date.now(),
              },
            ],
          }),
        }
      );

      if (!purgeReq.ok) {
        console.error('Failed to purge Vercel cache:', await purgeReq.text());
      }
    } else {
      console.log(`[Cache Invalidate] Simulated purge for tag: ${tag}. (Tokens missing)`);
    }

    return new Response(JSON.stringify({ success: true, purgedTag: tag }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cache Invalidate Error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
