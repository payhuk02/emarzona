/**
 * Edge function `enhance-image`
 * Améliore une image via Lovable AI (Gemini Nano Banana 2).
 * Body: { imageUrl: string, instruction?: string }
 * Response: { imageUrl: string } (data URL base64)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    'Vary': 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const DEFAULT_INSTRUCTION =
  "Improve this image for a premium e-commerce/marketplace listing: enhance lighting and contrast, sharpen details, balance colors, remove visual noise. Keep the subject 100% identical, do not add or remove any element.";

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { imageUrl, instruction } = await req.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'imageUrl manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Charger la config admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    let config: any = {};
    try {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb.rpc('get_ai_management_settings');
      config = (data as any)?.imageEnhancer ?? {};
    } catch (e) {
      console.warn('Could not load AI config, using defaults', e);
    }

    if (config?.enabled === false) {
      return new Response(
        JSON.stringify({ error: "L'amélioration d'image est désactivée par l'administrateur" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const model = config?.model || 'google/gemini-3.1-flash-image-preview';
    const finalInstruction = instruction || config?.defaultInstruction || DEFAULT_INSTRUCTION;

    const response = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
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
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ['image', 'text'],
        }),
      },
    );

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez dans un instant.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Crédits IA épuisés. Ajoutez du crédit dans les paramètres.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('AI gateway error', response.status, t);
      return new Response(
        JSON.stringify({ error: 'Échec de l\'amélioration de l\'image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const out =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;

    if (!out) {
      return new Response(
        JSON.stringify({ error: 'Aucune image générée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ imageUrl: out, model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('enhance-image error', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
