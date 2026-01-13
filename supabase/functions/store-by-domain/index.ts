/**
 * Edge Function: store-by-domain
 *
 * Récupère une boutique par son sous-domaine pour le système multi-tenant
 * Utilisé pour router les requêtes depuis *.myemarzona.shop vers la bonne boutique
 *
 * Date: 1 Février 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Headers CORS pour Cloudflare
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-subdomain',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 heures
};

interface StoreResponse {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  subdomain: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

serve(async req => {
  // Gérer les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Créer le client Supabase avec les credentials du service
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extraire le sous-domaine depuis les headers
    // Cloudflare passe le hostname dans le header 'host' ou 'x-forwarded-host'
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || '';
    const subdomain = extractSubdomain(host);

    if (!subdomain) {
      return new Response(
        JSON.stringify({
          error: 'Invalid subdomain',
          message: 'No subdomain found in request',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer la boutique depuis la base de données
    const { data: store, error } = await supabase.rpc('get_store_by_subdomain', {
      store_subdomain: subdomain,
    });

    if (error) {
      console.error('Error fetching store:', error);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Si aucune boutique trouvée, retourner 404
    if (!store || store.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Store not found',
          message: `No active store found for subdomain: ${subdomain}`,
          subdomain,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Retourner la boutique trouvée
    const storeData = store[0] as StoreResponse;

    return new Response(
      JSON.stringify({
        success: true,
        store: storeData,
        subdomain,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache 5 minutes
        },
      }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extrait le sous-domaine depuis le hostname
 * Exemples:
 * - "boutique.myemarzona.shop" -> "boutique"
 * - "www.boutique.myemarzona.shop" -> "boutique" (ignore www)
 * - "myemarzona.shop" -> null (pas de sous-domaine)
 */
function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Nettoyer le hostname (enlever le port si présent)
  const hostname = host.split(':')[0].toLowerCase();

  // Domaines de base
  const baseDomains = ['myemarzona.shop', 'emarzona.com', 'api.emarzona.com'];

  for (const baseDomain of baseDomains) {
    if (hostname === baseDomain) {
      // Pas de sous-domaine
      return null;
    }

    if (hostname.endsWith(`.${baseDomain}`)) {
      // Extraire le sous-domaine
      const subdomain = hostname.replace(`.${baseDomain}`, '');

      // Si c'est "www", essayer d'extraire le vrai sous-domaine
      if (subdomain.startsWith('www.')) {
        const realSubdomain = subdomain.replace('www.', '');
        return realSubdomain || null;
      }

      return subdomain || null;
    }
  }

  // Si aucun domaine de base ne correspond, essayer d'extraire quand même
  // (pour le développement local ou autres configurations)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // Prendre la première partie comme sous-domaine
    return parts[0];
  }

  return null;
}
