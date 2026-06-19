/**
 * Résolution clé API + appels passerelle IA (Lovable ou provider custom).
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptApiKey } from './ai-crypto.ts';

export type AiProvider = 'lovable' | 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';

const PROVIDER_ENV_KEYS: Record<AiProvider, string> = {
  lovable: 'LOVABLE_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_API_KEY',
  custom: 'CUSTOM_AI_API_KEY',
};

function resolveEnvApiKey(provider: AiProvider): string | undefined {
  const value = Deno.env.get(PROVIDER_ENV_KEYS[provider])?.trim();
  return value || undefined;
}

function chatCompletionsEndpoint(provider: AiProvider): {
  url: string;
  headers: Record<string, string>;
} {
  if (provider === 'openrouter') {
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'HTTP-Referer': siteUrl,
        'X-Title': 'Emarzona',
      },
    };
  }

  return {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    headers: {},
  };
}

export async function resolveAiApiKey(
  admin: SupabaseClient,
  provider: AiProvider = 'lovable'
): Promise<{ key: string; provider: AiProvider; source: 'env' | 'db' }> {
  const { data: rows } = await admin
    .from('platform_ai_api_keys')
    .select('provider, encrypted_key, is_default')
    .order('is_default', { ascending: false });

  const list = rows ?? [];
  const match =
    list.find(r => r.provider === provider && r.is_default) ||
    list.find(r => r.provider === provider) ||
    (provider === 'lovable' ? list.find(r => r.is_default) : undefined);

  if (match?.encrypted_key) {
    const key = await decryptApiKey(match.encrypted_key as string);
    return { key, provider: match.provider as AiProvider, source: 'db' };
  }

  const envKey = resolveEnvApiKey(provider);
  if (envKey) {
    return { key: envKey, provider, source: 'env' };
  }

  throw new Error(
    `Aucune clé API IA configurée pour « ${provider} » (${PROVIDER_ENV_KEYS[provider]} ou clé admin)`
  );
}

export async function callTextCompletion(options: {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  toolChoice?: unknown;
}): Promise<Response> {
  const provider = options.provider ?? 'lovable';
  const { url, headers: providerHeaders } = chatCompletionsEndpoint(provider);

  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...providerHeaders,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.toolChoice,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
    }),
  });
}

export async function callImageGeneration(options: {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  prompt: string;
}): Promise<string> {
  const provider = options.provider ?? 'lovable';
  const { url, headers: providerHeaders } = chatCompletionsEndpoint(provider);

  const body =
    provider === 'openrouter'
      ? {
          model: options.model,
          messages: [{ role: 'user', content: options.prompt }],
        }
      : {
          model: options.model,
          messages: [{ role: 'user', content: options.prompt }],
          modalities: ['image', 'text'],
        };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...providerHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${t.slice(0, 200)}`);
  }

  const data = await response.json();
  const imageUrl =
    data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
    data?.choices?.[0]?.message?.content;
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Aucune image générée par le modèle');
  }
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }
  throw new Error('Réponse image IA invalide');
}

export async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement image IA échoué (${res.status})`);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `data:${mime};base64,${b64}`;
}

export async function uploadBlogImageFromDataUrl(
  admin: SupabaseClient,
  dataUrl: string,
  slug: string,
  purpose: 'featured' | 'og'
): Promise<string> {
  const [header, b64] = dataUrl.split(',');
  if (!b64) throw new Error('Data URL invalide');
  const mime = header.match(/data:(.*?);/)?.[1] || 'image/png';
  const ext =
    mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const safeSlug =
    slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'draft';
  const path = `blog/${safeSlug}/ai-${purpose}-${Date.now()}.${ext}`;

  const { error } = await admin.storage.from('platform-assets').upload(path, bytes, {
    contentType: mime,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = admin.storage.from('platform-assets').getPublicUrl(path);
  return publicUrl;
}

const CATALOG_PREFIX: Record<string, string> = {
  digital: 'digital',
  products: 'products',
  services: 'services',
  courses: 'courses',
  artist: 'artist',
};

export async function uploadCatalogImageFromDataUrl(
  admin: SupabaseClient,
  dataUrl: string,
  catalogPath: string,
  productSlug: string
): Promise<string> {
  const [header, b64] = dataUrl.split(',');
  if (!b64) throw new Error('Data URL invalide');
  const mime = header.match(/data:(.*?);/)?.[1] || 'image/png';
  const ext =
    mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return uploadCatalogImageBytes(admin, bytes, catalogPath, productSlug, ext, mime);
}

export async function uploadCatalogImageBytes(
  admin: SupabaseClient,
  bytes: Uint8Array,
  catalogPath: string,
  productSlug: string,
  ext = 'jpg',
  contentType = 'image/jpeg'
): Promise<string> {
  const prefix = CATALOG_PREFIX[catalogPath] || catalogPath;
  const safeSlug =
    productSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'product';
  const path = `${prefix}/ai-${safeSlug}-${Date.now()}.${ext}`;

  const { error } = await admin.storage.from('product-images').upload(path, bytes, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = admin.storage.from('product-images').getPublicUrl(path);
  return publicUrl;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function mapGatewayError(status: number): { status: number; message: string } | null {
  if (status === 429) return { status: 429, message: 'Limite de requêtes IA atteinte.' };
  if (status === 402) return { status: 402, message: 'Crédits IA épuisés.' };
  return null;
}
