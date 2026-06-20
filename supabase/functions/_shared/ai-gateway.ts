/**
 * Résolution clé API + appels passerelle IA (OpenRouter).
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptApiKey } from './ai-crypto.ts';

export type AiProvider = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';

const PROVIDER_ENV_KEYS: Record<AiProvider, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_API_KEY',
  custom: 'CUSTOM_AI_API_KEY',
};

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

function openRouterHeaders(): Record<string, string> {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  return {
    'HTTP-Referer': siteUrl,
    'X-Title': 'Emarzona',
  };
}

function resolveEnvApiKey(provider: AiProvider): string | undefined {
  const value = Deno.env.get(PROVIDER_ENV_KEYS[provider])?.trim();
  return value || undefined;
}

/** Normalise le provider IA stocké en settings (rétrocompatibilité base). */
export function normalizeAiProvider(raw: unknown): AiProvider {
  if (raw === 'openrouter' || !raw) return 'openrouter';
  if (raw === 'openai' || raw === 'anthropic' || raw === 'google' || raw === 'custom') {
    return raw;
  }
  return 'openrouter';
}

export async function resolveAiApiKey(
  admin: SupabaseClient,
  provider: AiProvider = 'openrouter'
): Promise<{ key: string; provider: AiProvider; source: 'env' | 'db' }> {
  const { data: rows } = await admin
    .from('platform_ai_api_keys')
    .select('provider, encrypted_key, is_default')
    .order('is_default', { ascending: false });

  const list = rows ?? [];
  const match =
    list.find(r => r.provider === provider && r.is_default) ||
    list.find(r => r.provider === provider) ||
    list.find(r => r.provider === 'openrouter' && r.is_default) ||
    list.find(r => r.is_default);

  if (match?.encrypted_key) {
    const key = await decryptApiKey(match.encrypted_key as string);
    return { key, provider: normalizeAiProvider(match.provider), source: 'db' };
  }

  const envKey = resolveEnvApiKey(provider) ?? resolveEnvApiKey('openrouter');
  if (envKey) {
    return {
      key: envKey,
      provider: envKey === resolveEnvApiKey(provider) ? provider : 'openrouter',
      source: 'env',
    };
  }

  throw new Error(
    `Aucune clé API IA configurée pour « ${provider} » (${PROVIDER_ENV_KEYS[provider]} ou clé admin OpenRouter)`
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
  stream?: boolean;
}): Promise<Response> {
  return fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.toolChoice,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: options.stream ?? false,
    }),
  });
}

export async function callMultimodalCompletion(options: {
  apiKey: string;
  model: string;
  messages: unknown[];
}): Promise<Response> {
  return fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
    }),
  });
}

export async function callImageGeneration(options: {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: 'user', content: options.prompt }],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${t.slice(0, 200)}`);
  }

  const rawBody = await response.text();
  if (!rawBody.trim()) {
    throw new Error('Réponse image vide du modèle');
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    const directUrl = rawBody.trim();
    if (
      directUrl.startsWith('http://') ||
      directUrl.startsWith('https://') ||
      directUrl.startsWith('data:')
    ) {
      return directUrl;
    }
    throw new Error(`Réponse image invalide: ${directUrl.slice(0, 200)}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  const contentImageUrl =
    Array.isArray(content) && content.length > 0
      ? (
          content.find(
            part =>
              typeof part === 'object' &&
              part !== null &&
              'type' in part &&
              (part as { type?: string }).type === 'image_url'
          ) as { image_url?: { url?: string } } | undefined
        )?.image_url?.url
      : undefined;
  const imageUrl =
    data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
    contentImageUrl ??
    (typeof content === 'string' ? content : undefined);
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

export async function createOpenRouterEmbedding(
  text: string,
  apiKey: string,
  model = 'openai/text-embedding-3-small'
): Promise<number[]> {
  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model,
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding API ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('Réponse embedding invalide');
  }
  return embedding as number[];
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

export function isFreeOpenRouterModel(model: string): boolean {
  return model === 'openrouter/free' || model.endsWith(':free');
}

export function effectiveMaxTokens(model: string, requested: number): number {
  if (isFreeOpenRouterModel(model)) return Math.min(requested, 4096);
  return requested;
}

export function parseOpenRouterErrorBody(body: string, status: number): string {
  const trimmed = body.trim();
  if (!trimmed) return `Erreur passerelle IA (${status})`;
  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string } | string;
      message?: string;
    };
    const nested =
      typeof parsed.error === 'object' && parsed.error?.message
        ? parsed.error.message
        : typeof parsed.error === 'string'
          ? parsed.error
          : parsed.message;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  } catch {
    // corps non-JSON
  }
  return trimmed.slice(0, 500);
}

export async function readOpenRouterError(response: Response): Promise<string> {
  const mapped = mapGatewayError(response.status);
  if (mapped) return mapped.message;
  return parseOpenRouterErrorBody(await response.text(), response.status);
}

export function parseJsonFromModelContent(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error('Réponse IA invalide — JSON attendu');
  return safeParseStructuredJson(candidate);
}

function safeParseStructuredJson(candidate: string): Record<string, unknown> {
  const normalized = candidate.trim();
  try {
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    const repaired = repairPossiblyTruncatedJson(normalized);
    return JSON.parse(repaired) as Record<string, unknown>;
  }
}

function repairPossiblyTruncatedJson(input: string): string {
  let text = input.trim();
  text = text.replace(/,\s*([}\]])/g, '$1');

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if ((ch === '}' || ch === ']') && stack[stack.length - 1] === ch) stack.pop();
  }

  if (inString) text += '"';
  while (stack.length > 0) text += stack.pop();
  return text;
}

export async function completeStructuredWithToolFallback(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools: unknown[];
  toolName: string;
  jsonSchemaHint: string;
}): Promise<Record<string, unknown>> {
  const maxTokens = effectiveMaxTokens(options.model, options.maxTokens ?? 4000);

  let response = await callTextCompletion({
    apiKey: options.apiKey,
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    maxTokens,
    tools: options.tools,
    toolChoice: { type: 'function', function: { name: options.toolName } },
  });

  if (!response.ok) {
    const firstError = await readOpenRouterError(response);
    const mapped = mapGatewayError(response.status);
    if (mapped) throw new Error(mapped.message);

    const retryWithoutTools =
      response.status === 400 ||
      response.status === 404 ||
      response.status === 422 ||
      /tool|function|unsupported|not support|no endpoints/i.test(firstError);

    if (!retryWithoutTools) {
      throw new Error(firstError);
    }

    console.warn('Structured tool call failed, retrying JSON mode', response.status, firstError);
    response = await callTextCompletion({
      apiKey: options.apiKey,
      model: options.model,
      messages: [...options.messages, { role: 'system', content: options.jsonSchemaHint }],
      temperature: options.temperature,
      maxTokens,
    });

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }
  }

  const data = await response.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      return safeParseStructuredJson(toolCall.function.arguments);
    } catch {
      // Certains modèles renvoient des arguments d'outil tronqués ; on retombe sur le contenu texte.
    }
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) {
    return parseJsonFromModelContent(content);
  }

  throw new Error('Réponse IA invalide — aucun contenu structuré');
}

export function mapGatewayError(status: number): { status: number; message: string } | null {
  if (status === 429) return { status: 429, message: 'Limite de requêtes IA atteinte.' };
  if (status === 402) return { status: 402, message: 'Crédits IA épuisés.' };
  return null;
}

export function formatSupabaseError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object') {
    const rec = e as Record<string, unknown>;
    const parts = [rec.message, rec.details, rec.hint].filter(
      (p): p is string => typeof p === 'string' && p.length > 0
    );
    if (parts.length > 0) return parts.join(' — ');
    if (typeof rec.code === 'string') {
      return `Erreur base de données (${rec.code})`;
    }
  }
  return 'Erreur inconnue';
}
