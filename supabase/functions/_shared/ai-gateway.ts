/**
 * Résolution clé API + appels passerelle IA (Lovable ou provider custom).
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptApiKey } from './ai-crypto.ts';

export type AiProvider = 'lovable' | 'openai' | 'anthropic' | 'google' | 'custom';

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
    list.find(r => r.is_default);

  if (match?.encrypted_key) {
    const key = await decryptApiKey(match.encrypted_key as string);
    return { key, provider: match.provider as AiProvider, source: 'db' };
  }

  const lovable = Deno.env.get('LOVABLE_API_KEY');
  if (lovable) {
    return { key: lovable, provider: 'lovable', source: 'env' };
  }

  throw new Error('Aucune clé API IA configurée (LOVABLE_API_KEY ou clé admin)');
}

export async function callTextCompletion(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  toolChoice?: unknown;
}): Promise<Response> {
  return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
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
  model: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: 'user', content: options.prompt }],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${t.slice(0, 200)}`);
  }

  const data = await response.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error('Aucune image générée par le modèle');
  return url as string;
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
  const prefix = CATALOG_PREFIX[catalogPath] || catalogPath;
  const safeSlug =
    productSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'product';
  const path = `${prefix}/ai-${safeSlug}-${Date.now()}.${ext}`;

  const { error } = await admin.storage.from('product-images').upload(path, bytes, {
    contentType: mime,
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
