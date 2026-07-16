/**
 * Client — génération IA d'articles blog plateforme
 */
import { supabase } from '@/integrations/supabase/client';
import { extractDetailedMessage, extractErrorDetails } from '@/lib/geniuspay-error-extractor';

export interface BlogAIGenerateRequest {
  topic: string;
  brief?: string;
  targetKeywords?: string[] | string;
  categoryId?: string | null;
  language?: 'fr' | 'en';
  tone?: 'premium' | 'expert' | 'friendly' | 'educational';
  generateImage?: boolean;
  generateEnTranslation?: boolean;
  saveAsDraft?: boolean;
}

export interface BlogAIGeneratedArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  featured_image_url: string | null;
  featured_image_alt: string;
  og_image_url: string | null;
  author_name: string;
  author_bio: string | null;
  allow_comments: boolean;
  reading_time_minutes: number;
  status: 'draft';
  translations?: {
    en?: { title: string; excerpt: string; content: string };
  };
  image_prompt?: string;
}

export interface BlogAIGenerateResponse {
  article: BlogAIGeneratedArticle;
  postId: string | null;
  model: string;
  imageModel: string | null;
}

export interface PlatformAiApiKeyMeta {
  id: string;
  provider: string;
  label: string;
  key_hint: string;
  is_default: boolean;
  created_at: string;
}

const AI_CREDITS_HINT =
  ' Rechargez vos crédits OpenRouter ou ajoutez une clé API dans Administration → Gestion IA.';

async function throwEdgeFunctionError(
  data: { error?: string } | null | undefined,
  error: unknown,
  fallback: string
): Promise<void> {
  if (data?.error) {
    throw new Error(
      data.error.includes('Crédits IA') ? `${data.error.trim()}.${AI_CREDITS_HINT}` : data.error
    );
  }

  if (!error) return;

  const message = error instanceof Error ? error.message : String(error);
  const details = await extractErrorDetails(error, message);
  const detailed = extractDetailedMessage(details, fallback);

  if (/crédits ia|402|payment required|épuisé/i.test(detailed)) {
    throw new Error(`Crédits IA épuisés.${AI_CREDITS_HINT}`);
  }

  if (
    detailed &&
    !detailed.includes('non-2xx') &&
    !detailed.includes('Edge Function returned') &&
    detailed !== fallback
  ) {
    throw new Error(detailed);
  }

  throw new Error(error instanceof Error && error.message ? error.message : fallback);
}

export async function generateBlogArticleWithAI(
  request: BlogAIGenerateRequest
): Promise<BlogAIGenerateResponse> {
  const { data, error } = await supabase.functions.invoke('ai-generate-blog-post', {
    body: request,
  });
  await throwEdgeFunctionError(data, error, 'Échec génération article IA');
  return data as BlogAIGenerateResponse;
}

export async function listPlatformAiApiKeys(): Promise<PlatformAiApiKeyMeta[]> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'list' },
  });
  await throwEdgeFunctionError(data, error, 'Échec chargement des clés API IA');
  return (data?.keys ?? []) as PlatformAiApiKeyMeta[];
}

export async function addPlatformAiApiKey(payload: {
  provider: string;
  label: string;
  apiKey: string;
  isDefault?: boolean;
}): Promise<PlatformAiApiKeyMeta> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'add', ...payload },
  });
  await throwEdgeFunctionError(data, error, 'Échec ajout clé API IA');
  return data.key as PlatformAiApiKeyMeta;
}

export async function deletePlatformAiApiKey(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'delete', id },
  });
  await throwEdgeFunctionError(data, error, 'Échec suppression clé API IA');
}

export async function setDefaultPlatformAiApiKey(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'setDefault', id },
  });
  await throwEdgeFunctionError(data, error, 'Échec mise à jour clé API IA');
}
