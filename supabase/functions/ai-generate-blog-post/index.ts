/**
 * Edge function `ai-generate-blog-post`
 * Génère un article blog premium (brouillon) avec RAG, SEO, image et traduction EN optionnelle.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticatePlatformAdminRequest } from '../_shared/admin-auth-utils.ts';
import { retrievePlatformRagContext, type RagSettings } from '../_shared/platform-rag.ts';
import {
  callImageGenerationResilient,
  completeStructuredWithToolFallback,
  ensureDataUrl,
  fillTemplate,
  isFreeAiModel,
  mapGatewayError,
  normalizeAiProvider,
  normalizeModelForProvider,
  resolveAiApiKeyPool,
  uploadBlogImageFromDataUrl,
  type AiProvider,
} from '../_shared/ai-gateway.ts';
import { defaultFreeTextModel } from '../_shared/ai-models.ts';

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

interface BlogGeneratorConfig {
  enabled?: boolean;
  provider?: AiProvider;
  textModel?: string;
  imageModel?: string;
  systemPrompt?: string;
  articlePromptTemplate?: string;
  imagePromptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  minWords?: number;
  defaultTone?: string;
  defaultLanguage?: string;
  generateEnTranslation?: boolean;
  generateFeaturedImage?: boolean;
  autoSaveDraft?: boolean;
  authorName?: string;
  authorBio?: string;
  allowCommentsDefault?: boolean;
}

const BLOG_TOOL = {
  type: 'function',
  function: {
    name: 'output_blog_article',
    description: 'Article de blog structuré pour Emarzona',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Titre accrocheur 50-70 caractères' },
        slug: { type: 'string', description: 'slug-url-kebab-case' },
        excerpt: { type: 'string', description: 'Chapô 150-200 caractères' },
        content: { type: 'string', description: 'Corps HTML (h2, h3, p, ul, strong — pas de h1)' },
        tags: { type: 'array', items: { type: 'string' }, description: '5-8 tags' },
        seo_title: { type: 'string', description: '50-60 caractères' },
        seo_description: { type: 'string', description: '150-160 caractères avec CTA' },
        seo_keywords: { type: 'string', description: '10-15 mots-clés séparés par virgules' },
        featured_image_alt: { type: 'string', description: 'Description alt image' },
        image_prompt: { type: 'string', description: 'Prompt pour générer image hero' },
        en_title: { type: 'string' },
        en_excerpt: { type: 'string' },
        en_content: { type: 'string', description: 'Traduction EN en HTML' },
      },
      required: [
        'title',
        'slug',
        'excerpt',
        'content',
        'tags',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'featured_image_alt',
        'image_prompt',
      ],
    },
  },
};

const BLOG_JSON_HINT = `Réponds UNIQUEMENT avec un objet JSON valide (sans markdown) contenant :
title, slug, excerpt, content (HTML h2/h3/p/ul, pas de h1), tags (array),
seo_title, seo_description, seo_keywords, featured_image_alt, image_prompt,
et si demandé en_title, en_excerpt, en_content.`;

function resolveBlogTextModel(
  config: BlogGeneratorConfig,
  allSettings: Record<string, unknown>,
  provider: AiProvider
): string {
  const contentModel = (allSettings.contentGenerator as { model?: string } | undefined)?.model;
  const raw = config.textModel?.trim() || contentModel?.trim();
  if (raw) return normalizeModelForProvider(raw, provider);
  return defaultFreeTextModel(provider);
}

serve(async (req: Request) => {
  const headers = cors(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('authorization') ?? '' } },
  });
  const auth = await authenticatePlatformAdminRequest(userClient, req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const topic = (body?.topic as string)?.trim();
    const brief = (body?.brief as string)?.trim() || topic;
    const targetKeywords = Array.isArray(body?.targetKeywords)
      ? (body.targetKeywords as string[]).join(', ')
      : (body?.targetKeywords as string) || '';
    const categoryId = (body?.categoryId as string) || null;
    const language = (body?.language as string) || 'fr';
    const tone = (body?.tone as string) || 'premium';
    const generateImage = body?.generateImage !== false;
    const generateEn = body?.generateEnTranslation !== false;
    const saveAsDraft = body?.saveAsDraft !== false;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic requis' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let allSettings: Record<string, unknown> = {};
    const { data: settingsData, error: settingsError } = await admin.rpc(
      'get_ai_management_settings'
    );
    if (settingsError) {
      console.warn('Could not load AI settings, using defaults', settingsError);
    }
    allSettings = (settingsData as Record<string, unknown>) ?? {};
    const config = (allSettings.blogGenerator ?? {}) as BlogGeneratorConfig;

    if (config.enabled === false) {
      return new Response(JSON.stringify({ error: 'Générateur blog IA désactivé' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const provider = normalizeAiProvider(config.provider);
    const apiKeyPool = await resolveAiApiKeyPool(admin, provider);
    if (!apiKeyPool.length) {
      return new Response(JSON.stringify({ error: `Aucune clé API pour ${provider}` }), {
        status: 503,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    const textModel = resolveBlogTextModel(config, allSettings, provider);
    const imageModel = config.imageModel || 'gemini-2.0-flash-preview-image-generation';
    const isFreeModel = isFreeAiModel(textModel, provider);
    const minWords = isFreeModel
      ? Math.min(config.minWords ?? 1200, 700)
      : (config.minWords ?? 1200);
    const maxTokens = isFreeModel
      ? Math.min(config.maxTokens ?? 8000, 4096)
      : (config.maxTokens ?? 8000);

    let systemPrompt =
      config.systemPrompt ||
      'Tu es le rédacteur en chef du blog Emarzona, plateforme e-commerce premium.';

    const ragConfig = (allSettings.rag ?? {}) as RagSettings;
    if (ragConfig.enabled !== false) {
      try {
        const ragContext = await retrievePlatformRagContext(
          admin,
          `${topic} ${brief} ${targetKeywords}`,
          apiKeyPool[0].key,
          { ...ragConfig, locale: language }
        );
        if (ragContext) {
          systemPrompt += `\n\nContexte plateforme Emarzona (RAG) :\n${ragContext}`;
        }
      } catch (ragErr) {
        console.warn('RAG blog generation skipped', ragErr);
      }
    }

    const articleTemplate =
      config.articlePromptTemplate ||
      'Rédige un article premium sur : {{topic}}\nBrief : {{brief}}\nTon : {{tone}}\nLangue : {{language}}\nMots-clés : {{keywords}}\nMinimum {{minWords}} mots.';

    const userPrompt = fillTemplate(articleTemplate, {
      topic,
      brief,
      tone,
      language,
      keywords: targetKeywords || 'e-commerce, Emarzona, vente en ligne',
      minWords: String(minWords),
    });

    if (generateEn) {
      systemPrompt +=
        '\n\nInclus aussi en_title, en_excerpt et en_content (traduction anglaise complète du même article).';
    }

    const textRes = await completeStructuredWithToolFallback({
      admin,
      provider,
      model: textModel,
      apiKeyPool,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature ?? 0.75,
      maxTokens,
      tools: [BLOG_TOOL],
      toolName: 'output_blog_article',
      jsonSchemaHint: BLOG_JSON_HINT,
    });

    const article = textRes;
    const slug = String(article.slug || topic)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 96);

    let featuredImageUrl: string | null = null;
    let ogImageUrl: string | null = null;

    const shouldGenerateImage =
      generateImage &&
      config.generateFeaturedImage !== false &&
      !(provider === 'openrouter' && isFreeModel);
    if (shouldGenerateImage) {
      const imageTemplate =
        config.imagePromptTemplate ||
        'Premium blog hero image about: {{title}}. Professional e-commerce, no text.';
      const imagePrompt = fillTemplate(imageTemplate, {
        title: String(article.title),
        topic,
      });
      const finalImagePrompt = String(article.image_prompt || imagePrompt);

      try {
        const { imageUrl: rawUrl } = await callImageGenerationResilient(admin, {
          provider,
          model: imageModel,
          prompt: finalImagePrompt,
          apiKeyPool,
        });
        const dataUrl = await ensureDataUrl(rawUrl);
        featuredImageUrl = await uploadBlogImageFromDataUrl(admin, dataUrl, slug, 'featured');
        ogImageUrl = featuredImageUrl;
      } catch (imgErr) {
        console.warn('Blog image generation failed', imgErr);
      }
    }

    const translations: Record<string, Record<string, string>> = {};
    if (generateEn && article.en_title) {
      translations.en = {
        title: String(article.en_title),
        excerpt: String(article.en_excerpt || ''),
        content: String(article.en_content || ''),
      };
    }

    const postRow = {
      slug,
      title: String(article.title),
      excerpt: String(article.excerpt),
      content: String(article.content),
      status: 'draft' as const,
      category_id: categoryId,
      author_name: config.authorName || 'Emarzona',
      author_bio: config.authorBio || null,
      featured_image_url: featuredImageUrl,
      featured_image_alt: String(article.featured_image_alt || article.title),
      tags: Array.isArray(article.tags) ? article.tags.map(String) : [],
      is_featured: false,
      allow_comments: config.allowCommentsDefault !== false,
      reading_time_minutes: Math.max(
        1,
        Math.ceil(String(article.content).split(/\s+/).length / 200)
      ),
      published_at: null,
      scheduled_at: null,
      seo_title: String(article.seo_title),
      seo_description: String(article.seo_description),
      seo_keywords: String(article.seo_keywords),
      canonical_url: null,
      og_image_url: ogImageUrl,
      noindex: false,
      translations,
    };

    let postId: string | null = null;
    if (saveAsDraft && config.autoSaveDraft !== false) {
      const { data: inserted, error: insertError } = await admin
        .from('platform_blog_posts')
        .insert(postRow)
        .select('id')
        .single();
      if (insertError) throw insertError;
      postId = inserted?.id ?? null;
    }

    return new Response(
      JSON.stringify({
        article: {
          ...postRow,
          image_prompt: article.image_prompt,
        },
        postId,
        model: textModel,
        imageModel: shouldGenerateImage ? imageModel : null,
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('ai-generate-blog-post error', e);
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    const mapped = mapGatewayError(
      /crédits|402|payment required/i.test(message) ? 402 : /limite|429/i.test(message) ? 429 : 500
    );
    return new Response(JSON.stringify({ error: mapped?.message ?? message }), {
      status: mapped?.status ?? 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
