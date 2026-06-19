/**
 * Client — génération IA d'articles blog plateforme
 */
import { supabase } from '@/integrations/supabase/client';

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

function throwEdgeFunctionError(
  data: { error?: string } | null | undefined,
  error: Error | null,
  fallback: string
): void {
  if (data?.error) throw new Error(data.error);
  if (error) throw new Error(error.message || fallback);
}

export async function generateBlogArticleWithAI(
  request: BlogAIGenerateRequest
): Promise<BlogAIGenerateResponse> {
  const { data, error } = await supabase.functions.invoke('ai-generate-blog-post', {
    body: request,
  });
  throwEdgeFunctionError(data, error, 'Échec génération article IA');
  return data as BlogAIGenerateResponse;
}

export async function listPlatformAiApiKeys(): Promise<PlatformAiApiKeyMeta[]> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'list' },
  });
  throwEdgeFunctionError(data, error, 'Échec chargement des clés API IA');
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
  throwEdgeFunctionError(data, error, 'Échec ajout clé API IA');
  return data.key as PlatformAiApiKeyMeta;
}

export async function deletePlatformAiApiKey(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'delete', id },
  });
  throwEdgeFunctionError(data, error, 'Échec suppression clé API IA');
}

export async function setDefaultPlatformAiApiKey(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-ai-api-keys', {
    body: { action: 'setDefault', id },
  });
  throwEdgeFunctionError(data, error, 'Échec mise à jour clé API IA');
}
