/**
 * Edge function `ai-generate-content`
 * Génère descriptions premium + SEO + image pour les 5 verticales Emarzona.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuthenticatedUser } from '../_shared/edge-auth-utils.ts';
import { retrievePlatformRagContext, type RagSettings } from '../_shared/platform-rag.ts';
import {
  callImageGeneration,
  callTextCompletion,
  ensureDataUrl,
  fillTemplate,
  mapGatewayError,
  resolveAiApiKey,
  uploadCatalogImageFromDataUrl,
  type AiProvider,
} from '../_shared/ai-gateway.ts';
import {
  buildProductSystemPrompt,
  buildProductUserPrompt,
  CATALOG_PATH_BY_TYPE,
  PRODUCT_CONTENT_TOOL,
  PRODUCT_TYPE_LABELS,
  type ProductAiType,
} from '../_shared/product-ai-prompts.ts';

const VALID_TYPES = ['digital', 'physical', 'service', 'course', 'artist'] as const;

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

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuthenticatedUser(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { productInfo, language, generateImage } = body;

    if (!productInfo?.name || !productInfo?.type) {
      return new Response(
        JSON.stringify({ error: 'productInfo.name et productInfo.type requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productType = productInfo.type as string;
    if (!VALID_TYPES.includes(productType as (typeof VALID_TYPES)[number])) {
      return new Response(
        JSON.stringify({
          error: `Type invalide. Valeurs : ${VALID_TYPES.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const admin = createClient(supabaseUrl, serviceKey);

    let allSettings: Record<string, unknown> = {};
    let config: Record<string, unknown> = {};
    try {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb.rpc('get_ai_management_settings');
      allSettings = (data as Record<string, unknown> | null) ?? {};
      config = (allSettings.contentGenerator as Record<string, unknown>) ?? {};
    } catch (e) {
      console.warn('Could not load AI config, using defaults', e);
    }

    if (config?.enabled === false || config?.provider === 'templates') {
      return new Response(
        JSON.stringify({
          error: 'AI generator disabled — use template fallback',
          useTemplates: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { key: apiKey } = await resolveAiApiKey(
      admin,
      (config.provider as AiProvider) || 'lovable'
    );
    const model = (config.model as string) || 'google/gemini-3.1-pro-preview';
    const imageModel = (config.imageModel as string) || 'google/gemini-3.1-flash-image-preview';
    const minWords = typeof config.minWords === 'number' ? config.minWords : 350;
    const typePrompts = (config.typeSystemPrompts as Record<string, string>) ?? {};

    let systemPrompt = buildProductSystemPrompt(
      (config.systemPrompt as string) ||
        'Tu es un expert copywriter e-commerce premium pour Emarzona, marketplace multi-boutiques.',
      productType as ProductAiType,
      typePrompts
    );

    const ragConfig = (allSettings.rag ?? {}) as RagSettings;
    if (ragConfig.enabled !== false && serviceKey) {
      try {
        const query = [
          productInfo.name,
          productInfo.category,
          productInfo.type,
          productInfo.targetAudience,
          productInfo.artistName,
        ]
          .filter(Boolean)
          .join(' — ');
        const ragContext = await retrievePlatformRagContext(admin, query, apiKey, {
          ...ragConfig,
          locale: language || 'fr',
        });
        if (ragContext) {
          systemPrompt += `\n\nContexte plateforme Emarzona (RAG) :\n${ragContext}`;
        }
      } catch (ragError) {
        console.warn('RAG product generation skipped', ragError);
      }
    }

    const userPrompt = buildProductUserPrompt(
      {
        name: productInfo.name,
        type: productType as ProductAiType,
        category: productInfo.category,
        price: productInfo.price,
        features: productInfo.features,
        targetAudience: productInfo.targetAudience,
        artistName: productInfo.artistName,
        artworkMedium: productInfo.artworkMedium,
        courseLevel: productInfo.courseLevel,
      },
      language || 'fr',
      minWords
    );

    const textRes = await callTextCompletion({
      apiKey,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
      maxTokens: typeof config.maxTokens === 'number' ? config.maxTokens : 4000,
      tools: [PRODUCT_CONTENT_TOOL],
      toolChoice: { type: 'function', function: { name: 'output_product_content' } },
    });

    const mapped = mapGatewayError(textRes.status);
    if (mapped) {
      return new Response(JSON.stringify({ error: mapped.message }), {
        status: mapped.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!textRes.ok) {
      const t = await textRes.text();
      console.error('AI gateway error', textRes.status, t);
      return new Response(JSON.stringify({ error: 'Échec génération' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const textData = await textRes.json();
    const toolCall = textData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: 'Réponse IA invalide' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const content = {
      shortDescription: String(parsed.shortDescription),
      longDescription: String(parsed.longDescription),
      features: Array.isArray(parsed.features) ? parsed.features.map(String) : [],
      metaTitle: String(parsed.metaTitle),
      metaDescription: String(parsed.metaDescription),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
      ogTitle: String(parsed.ogTitle || parsed.metaTitle),
      ogDescription: String(parsed.ogDescription || parsed.metaDescription),
      imagePrompt: String(parsed.imagePrompt || ''),
    };

    let imageUrl: string | null = null;
    const shouldGenerateImage = generateImage !== false && config.generateProductImage !== false;
    if (shouldGenerateImage) {
      const imageTemplate =
        (config.imagePromptTemplate as string) ||
        'Premium product photo for {{typeLabel}}: {{name}}. {{category}}. Studio lighting, no text.';
      const imagePrompt =
        content.imagePrompt ||
        fillTemplate(imageTemplate, {
          name: productInfo.name,
          category: productInfo.category || '',
          typeLabel: PRODUCT_TYPE_LABELS[productType as ProductAiType],
        });

      try {
        const rawUrl = await callImageGeneration({
          apiKey,
          model: imageModel,
          prompt: imagePrompt,
        });
        const dataUrl = await ensureDataUrl(rawUrl);
        const catalogPath = CATALOG_PATH_BY_TYPE[productType as ProductAiType];
        const slug = productInfo.slug || productInfo.name;
        imageUrl = await uploadCatalogImageFromDataUrl(admin, dataUrl, catalogPath, slug);
      } catch (imgErr) {
        console.warn('Product image generation failed', imgErr);
      }
    }

    return new Response(JSON.stringify({ content: { ...content, imageUrl }, model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-generate-content error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
