import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts métier optimisés pour le e-commerce (SEO + conversion)
const PROMPT_TEMPLATES: Record<string, (ctx: Record<string, string>) => string> = {
  description:
    ctx => `Tu es un expert copywriter e-commerce avec 15 ans d'expérience en rédaction de fiches produits à fort taux de conversion.

Génère une description de produit professionnelle pour :
- Nom du produit : "${ctx.productName}"
- Catégorie : "${ctx.category || 'Non spécifiée'}"
- Détails fournis par le vendeur : "${ctx.sellerNotes || 'Aucun'}"

La description doit :
1. Être optimisée SEO (mots-clés naturels, pas de bourrage)
2. Utiliser un ton professionnel mais engageant
3. Contenir 150 à 250 mots
4. Inclure des bullet points pour les caractéristiques clés
5. Terminer par un appel à l'action subtil

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "title": "Titre SEO optimisé (max 70 caractères)",
  "description": "Description longue avec paragraphes et bullet points en markdown",
  "short_description": "Description courte (max 160 caractères, idéale pour la meta description)",
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,

  seo: ctx => `Tu es un expert SEO e-commerce. Génère des métadonnées SEO optimisées pour ce produit :
- Nom : "${ctx.productName}"
- Description actuelle : "${ctx.currentDescription || 'Aucune'}"

Réponds UNIQUEMENT en JSON valide :
{
  "meta_title": "Titre SEO (max 60 caractères)",
  "meta_description": "Meta description (max 155 caractères)",
  "seo_tags": ["tag1", "tag2", "tag3"],
  "suggested_slug": "slug-optimise-seo"
}`,

  marketing:
    ctx => `Tu es un expert en marketing digital e-commerce. Génère du contenu marketing pour :
- Produit : "${ctx.productName}"
- Prix : "${ctx.price || 'Non spécifié'}"
- Public cible : "${ctx.targetAudience || 'Grand public'}"

Réponds UNIQUEMENT en JSON valide :
{
  "headline": "Accroche marketing percutante (max 80 caractères)",
  "value_proposition": "Proposition de valeur unique en 1-2 phrases",
  "social_media_caption": "Légende pour les réseaux sociaux (max 280 caractères, avec emojis)",
  "email_subject_line": "Objet d'email marketing"
}`,
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseAdmin();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      storeId,
      promptType,
      productId,
      productName,
      category,
      sellerNotes,
      currentDescription,
      price,
      targetAudience,
    } = await req.json();

    if (!storeId || !promptType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: storeId, promptType' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Consume AI Credit (utilise la RPC créée en Phase 5 - Sprint 1)
    const { data: hasCredits, error: rpcError } = await supabase.rpc('consume_ai_credit', {
      p_store_id: storeId,
      p_cost: 1,
    });

    if (rpcError || !hasCredits) {
      return new Response(JSON.stringify({ error: 'Insufficient AI credits or unauthorized' }), {
        status: 402, // Payment Required
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Construction du prompt
    const promptBuilder = PROMPT_TEMPLATES[promptType];
    if (!promptBuilder) {
      return new Response(
        JSON.stringify({
          error: `Unknown promptType: ${promptType}. Supported: description, seo, marketing`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = promptBuilder({
      productName: productName || '',
      category: category || '',
      sellerNotes: sellerNotes || '',
      currentDescription: currentDescription || '',
      price: price || '',
      targetAudience: targetAudience || '',
    });

    // 3. Appel LLM (OpenAI direct ou OpenRouter en fallback)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const apiKey = openaiKey || openrouterKey;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'No AI API key configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY in Supabase secrets.',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiUrl = openaiKey
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const llmResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(openrouterKey && !openaiKey
          ? {
              'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
              'X-Title': 'Emarzona',
            }
          : {}),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant spécialisé en e-commerce. Réponds toujours en JSON valide, sans markdown autour.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmResponse.ok) {
      const errBody = await llmResponse.text();
      console.error('LLM API Error:', llmResponse.status, errBody);
      return new Response(JSON.stringify({ error: `LLM API error: ${llmResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const llmData = await llmResponse.json();
    const rawContent = llmData.choices?.[0]?.message?.content || '{}';
    const tokensUsed = llmData.usage?.total_tokens || 0;

    let generatedData: Record<string, unknown>;
    try {
      generatedData = JSON.parse(rawContent);
    } catch {
      generatedData = { raw: rawContent, parse_error: true };
    }

    // 4. Log the generation dans la table d'audit
    await supabase.from('ai_product_generations').insert({
      store_id: storeId,
      product_id: productId,
      model_used: 'gpt-4o-mini',
      prompt_type: promptType,
      generated_content: generatedData,
      tokens_used: tokensUsed,
    });

    return new Response(JSON.stringify({ data: generatedData, tokens_used: tokensUsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Product Generate Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
