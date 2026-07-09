import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isDefaultAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === 'emarzona.com' ||
      hostname === 'www.emarzona.com' ||
      hostname.endsWith('.emarzona.com') ||
      hostname === 'myemarzona.shop' ||
      hostname.endsWith('.myemarzona.shop')
    );
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  const allowOrigin = allowedOrigins.includes(origin)
    ? origin
    : isDefaultAllowedOrigin(origin)
      ? origin
      : allowedOrigins[0] || 'https://www.emarzona.com';

  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
  };
}

function jsonResponse(req: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return jsonResponse(req, { error: 'Server misconfigured' }, 500);
    }

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return jsonResponse(req, { error: 'Unauthorized' }, 401);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
      return jsonResponse(req, { error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { domain_id } = await req.json();

    if (!domain_id) {
      return jsonResponse(req, { error: 'domain_id is required' }, 400);
    }

    // Récupérer le domaine
    const { data: domainRecord, error: fetchError } = await supabase
      .from('custom_domains')
      .select('id, store_id, domain, stores!inner(user_id)')
      .eq('id', domain_id)
      .single();

    if (fetchError || !domainRecord) {
      return jsonResponse(req, { error: 'Domain not found' }, 404);
    }

    const ownerId = (domainRecord as any).stores?.user_id;
    if (!ownerId || ownerId !== user.id) {
      return jsonResponse(req, { error: 'Forbidden' }, 403);
    }

    const domain = domainRecord.domain;

    // 1. Supprimer le domaine du projet Vercel via l'API Vercel
    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');

    if (vercelToken && vercelProjectId) {
      try {
        const vercelRes = await fetch(
          `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!vercelRes.ok && vercelRes.status !== 404) {
          const vercelError = await vercelRes.json();
          console.error('Vercel API error when deleting:', vercelError);
        } else {
          console.log(`Domaine ${domain} supprimé du projet Vercel avec succès.`);
        }
      } catch (vErr) {
        console.error('Failed to call Vercel API for deletion:', vErr);
      }
    } else {
      console.warn(
        'VERCEL_API_TOKEN ou VERCEL_PROJECT_ID non configurés, suppression sur Vercel ignorée.'
      );
    }

    // 2. Mettre à jour le champ custom_domain dans la table stores si c'était celui-ci
    const { data: storeData } = await supabase
      .from('stores')
      .select('custom_domain')
      .eq('id', domainRecord.store_id)
      .single();

    if (storeData && storeData.custom_domain === domain) {
      await supabase
        .from('stores')
        .update({
          custom_domain: null,
          domain_status: 'not_configured',
          domain_verification_token: null,
          domain_verified_at: null,
          error_message: null,
        })
        .eq('id', domainRecord.store_id);
    }

    // 3. Supprimer de la table custom_domains
    const { error: deleteError } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domain_id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return jsonResponse(req, { error: 'Failed to delete domain from database' }, 500);
    }

    return jsonResponse(
      req,
      {
        success: true,
        domain,
        message: 'Domaine supprimé avec succès',
      },
      200
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return jsonResponse(
      req,
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
