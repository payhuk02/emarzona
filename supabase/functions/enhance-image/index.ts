/**
 * Edge function `enhance-image`
 * Améliore une image via Lovable AI (Gemini Nano Banana 2).
 * Body: { imageUrl: string, instruction?: string }
 * Response: { imageUrl: string } (data URL base64)
 */

import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** L'IA renvoie parfois une URL HTTPS ; le navigateur ne peut pas la fetch (CSP). */
async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de télécharger l'image IA (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
  return `data:${mime};base64,${base64Encode(new Uint8Array(buf))}`;
}

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

const DEFAULT_INSTRUCTION =
  'Improve this image for a premium e-commerce/marketplace listing: enhance lighting and contrast, sharpen details, balance colors, remove visual noise. Keep the subject 100% identical, do not add or remove any element.';

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'Connexion requise' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Session invalide ou expirée' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY non configurée' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const inputImageUrl = body?.imageUrl;
    const instruction = body?.instruction;

    if (!inputImageUrl || typeof inputImageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'imageUrl manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (inputImageUrl.length > 12_000_000) {
      return new Response(
        JSON.stringify({ error: 'Image trop volumineuse. Réduisez la taille du fichier.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let config: Record<string, unknown> = {};
    try {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb.rpc('get_ai_management_settings');
      config = ((data as Record<string, unknown>)?.imageEnhancer ?? {}) as Record<string, unknown>;
    } catch (e) {
      console.warn('Could not load AI config, using defaults', e);
    }

    if (config?.enabled === false) {
      return new Response(
        JSON.stringify({ error: "L'amélioration d'image est désactivée par l'administrateur" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const model =
      (typeof config.model === 'string' && config.model) || 'google/gemini-3.1-flash-image-preview';
    const defaultInstr =
      typeof config.defaultInstruction === 'string' ? config.defaultInstruction : '';
    const finalInstruction =
      (typeof instruction === 'string' && instruction.trim()) ||
      defaultInstr ||
      DEFAULT_INSTRUCTION;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: finalInstruction },
              { type: 'image_url', image_url: { url: inputImageUrl } },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez dans un instant.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Crédits IA épuisés. Ajoutez du crédit dans les paramètres.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('AI gateway error', response.status, t);
      return new Response(JSON.stringify({ error: "Échec de l'amélioration de l'image" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const out = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;

    if (!out) {
      return new Response(JSON.stringify({ error: 'Aucune image générée' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resultImageUrl = await ensureDataUrl(out);

    return new Response(JSON.stringify({ imageUrl: resultImageUrl, model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('enhance-image error', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
