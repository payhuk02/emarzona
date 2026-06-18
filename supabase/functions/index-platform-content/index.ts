/**
 * Edge function `index-platform-content`
 * Indexe blog, FAQ et produits dans content_embeddings (RAG profond).
 * Réservé aux admins plateforme (settings.manage) ou service_role.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateAdminRequest } from '../_shared/admin-auth-utils.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  indexBlogPosts,
  indexFaqItems,
  indexProducts,
  type ContentSourceType,
} from '../_shared/platform-rag.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';

function cors(origin: string | null) {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
    .split(',')
    .map(s => s.trim());
  const o = origin && allowed.includes(origin) ? origin : defaultAllowedOrigin;
  return {
    'Access-Control-Allow-Origin': o,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req: Request) => {
  const headers = cors(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const lovableKey = Deno.env.get('LOVABLE_API_KEY') ?? '';

  if (!supabaseUrl || !serviceKey || !lovableKey) {
    return new Response(JSON.stringify({ error: 'Configuration serveur incomplète' }), {
      status: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const isServiceRole = authHeader === `Bearer ${serviceKey}`;

  if (!isServiceRole) {
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const auth = await authenticateAdminRequest(userClient, req, 'settings.manage');
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const locales = Array.isArray(body?.locales)
      ? (body.locales as string[]).filter(l => l === 'fr' || l === 'en')
      : ['fr'];
    const sources = (
      Array.isArray(body?.sources) ? body.sources : ['blog', 'faq', 'product']
    ) as ContentSourceType[];

    let embeddingModel = 'openai/text-embedding-3-small';
    const admin = createSupabaseAdmin();
    const { data: settings } = await admin.rpc('get_ai_management_settings');
    const rag = (settings as Record<string, unknown> | null)?.rag as
      | Record<string, unknown>
      | undefined;
    if (typeof rag?.embeddingModel === 'string') {
      embeddingModel = rag.embeddingModel;
    }

    const stats: Record<string, number> = {};

    for (const locale of locales) {
      const loc = locale as 'fr' | 'en';
      if (sources.includes('blog')) {
        const key = `blog_${loc}`;
        stats[key] =
          (stats[key] ?? 0) + (await indexBlogPosts(admin, lovableKey, embeddingModel, loc));
      }
      if (sources.includes('faq')) {
        const key = `faq_${loc}`;
        stats[key] =
          (stats[key] ?? 0) + (await indexFaqItems(admin, lovableKey, embeddingModel, loc));
      }
      if (sources.includes('product')) {
        const key = `product_${loc}`;
        stats[key] =
          (stats[key] ?? 0) + (await indexProducts(admin, lovableKey, embeddingModel, loc));
      }
    }

    const totalChunks = Object.values(stats).reduce((a, b) => a + b, 0);

    return new Response(
      JSON.stringify({
        ok: true,
        totalChunks,
        stats,
        embeddingModel,
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('index-platform-content error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur indexation' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
