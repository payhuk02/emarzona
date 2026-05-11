/**
 * Edge function `ai-generate-content`
 * Génère du contenu produit (description, SEO, keywords) via Lovable AI Gateway.
 * Body: { productInfo: { name, type, category?, price?, features?, targetAudience? } }
 * Response: { shortDescription, longDescription, features[], metaTitle, metaDescription, keywords[] }
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

function buildPrompt(p: any, language = 'fr') {
  const types: Record<string, string> = { digital: 'numérique', physical: 'physique', service: 'service' };
  return `Génère du contenu e-commerce SEO en ${language} pour ce produit:
- Nom: ${p.name}
- Type: ${types[p.type] || p.type}
- Catégorie: ${p.category || 'non spécifiée'}
- Prix: ${p.price ? `${p.price} XOF` : 'non défini'}
${p.features?.length ? `- Caractéristiques: ${p.features.join(', ')}` : ''}
${p.targetAudience ? `- Public cible: ${p.targetAudience}` : ''}

Sois concret, intègre des mots-clés naturellement, mets en avant les bénéfices.`;
}

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

    const { productInfo, language } = await req.json();
    if (!productInfo?.name || !productInfo?.type) {
      return new Response(
        JSON.stringify({ error: 'productInfo.name et productInfo.type requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Charger config admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    let config: any = {};
    try {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb.rpc('get_ai_management_settings');
      config = (data as any)?.contentGenerator ?? {};
    } catch (e) {
      console.warn('Could not load AI config, using defaults', e);
    }

    if (config?.enabled === false || config?.provider === 'templates') {
      return new Response(
        JSON.stringify({ error: 'AI generator disabled — use template fallback', useTemplates: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const model = config?.model || 'google/gemini-3-flash-preview';
    const systemPrompt = config?.systemPrompt || 'Tu es un expert en rédaction e-commerce SEO.';
    const temperature = typeof config?.temperature === 'number' ? config.temperature : 0.7;
    const maxTokens = typeof config?.maxTokens === 'number' ? config.maxTokens : 2000;

    const tools = [{
      type: 'function',
      function: {
        name: 'output_product_content',
        description: 'Retourne le contenu structuré du produit',
        parameters: {
          type: 'object',
          properties: {
            shortDescription: { type: 'string', description: '120-150 caractères, accrocheuse' },
            longDescription: { type: 'string', description: '250-400 mots, structurée, SEO' },
            features: { type: 'array', items: { type: 'string' }, description: '5-8 points clés' },
            metaTitle: { type: 'string', description: '50-60 caractères' },
            metaDescription: { type: 'string', description: '150-160 caractères avec CTA' },
            keywords: { type: 'array', items: { type: 'string' }, description: '10 mots-clés pertinents' },
          },
          required: ['shortDescription', 'longDescription', 'features', 'metaTitle', 'metaDescription', 'keywords'],
          additionalProperties: false,
        },
      },
    }];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: buildPrompt(productInfo, language || 'fr') },
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'output_product_content' } },
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Limite de requêtes atteinte.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Crédits IA épuisés.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('AI gateway error', response.status, t);
      return new Response(
        JSON.stringify({ error: 'Échec génération' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: 'Réponse IA invalide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const content = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({ content, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('ai-generate-content error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
