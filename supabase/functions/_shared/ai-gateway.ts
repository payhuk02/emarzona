/**
 * Résolution clé API + appels multi-providers (OpenRouter, Google Gemini direct).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { decryptApiKey } from './ai-crypto.ts';
import {
  defaultFreeTextModel,
  isFreeAiModel,
  normalizeGoogleModel,
  resolveImageModelCandidates,
  resolveTextModelCandidates,
} from './ai-models.ts';

export type ResolvedApiKey = {
  id: string | null;
  key: string;
  label: string;
  provider: AiProvider;
  source: 'db' | 'env';
  isDefault: boolean;
};

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
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function openRouterHeaders(): Record<string, string> {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  return {
    'HTTP-Referer': siteUrl,
    'X-Title': 'Emarzona',
  };
}

function resolveEnvApiKey(provider: AiProvider): string | undefined {
  if (provider === 'google') {
    const gemini = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (gemini) return gemini;
  }
  const value = Deno.env.get(PROVIDER_ENV_KEYS[provider])?.trim();
  return value || undefined;
}

export function normalizeModelForProvider(model: string, provider: AiProvider): string {
  const trimmed = model.trim();
  if (!trimmed) return defaultFreeTextModel(provider);
  if (provider === 'google') return normalizeGoogleModel(trimmed);
  return trimmed;
}

type OpenAiCompatibleResponse = {
  choices: Array<{
    message: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    };
  }>;
};

function buildGeminiContents(messages: Array<{ role: string; content: string }>) {
  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  return { systemMsg, contents };
}

function geminiToolsFromOpenAi(tools?: unknown[]) {
  if (!tools?.length) return undefined;
  const declarations = (
    tools as Array<{ function?: { name?: string; description?: string; parameters?: unknown } }>
  )
    .map(t => t.function)
    .filter((fn): fn is { name: string; description?: string; parameters?: unknown } => !!fn?.name)
    .map(fn => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    }));
  if (!declarations.length) return undefined;
  return [{ functionDeclarations: declarations }];
}

function geminiToolConfig(toolChoice?: unknown) {
  const fnName = (toolChoice as { function?: { name?: string } } | undefined)?.function?.name;
  return {
    functionCallingConfig: {
      mode: 'ANY',
      ...(fnName ? { allowedFunctionNames: [fnName] } : {}),
    },
  };
}

function wrapGeminiResponse(data: Record<string, unknown>): OpenAiCompatibleResponse {
  const parts =
    (
      data?.candidates as
        | Array<{ content?: { parts?: Array<Record<string, unknown>> } }>
        | undefined
    )?.[0]?.content?.parts ?? [];

  let content = '';
  const toolCalls: OpenAiCompatibleResponse['choices'][0]['message']['tool_calls'] = [];
  const images: Array<{ image_url: { url: string } }> = [];

  for (const part of parts) {
    if (typeof part.text === 'string') content += part.text;
    const fnCall = part.functionCall as
      | { name?: string; args?: Record<string, unknown> }
      | undefined;
    if (fnCall?.name) {
      toolCalls.push({
        id: `call_${toolCalls.length}`,
        type: 'function',
        function: {
          name: fnCall.name,
          arguments: JSON.stringify(fnCall.args ?? {}),
        },
      });
    }
    const inline = part.inlineData as { mimeType?: string; data?: string } | undefined;
    if (inline?.data) {
      const mime = inline.mimeType || 'image/png';
      images.push({ image_url: { url: `data:${mime};base64,${inline.data}` } });
    }
  }

  return {
    choices: [
      {
        message: {
          ...(content ? { content } : {}),
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
          ...(images.length ? { images, content: images[0]?.image_url?.url ?? content } : {}),
        },
      },
    ],
  };
}

async function callGeminiGenerateContent(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  toolChoice?: unknown;
  responseModalities?: string[];
}): Promise<Response> {
  const model = normalizeGoogleModel(options.model);
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(options.apiKey)}`;
  const { systemMsg, contents } = buildGeminiContents(options.messages);
  const tools = geminiToolsFromOpenAi(options.tools);

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 4000,
      ...(options.responseModalities?.length
        ? { responseModalities: options.responseModalities }
        : {}),
    },
  };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }
  if (tools) {
    body.tools = tools;
    body.toolConfig = geminiToolConfig(options.toolChoice);
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return new Response(raw, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new Response(raw, { status: 502, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response(JSON.stringify(wrapGeminiResponse(parsed)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseGeminiImageDataUrl(data: Record<string, unknown>): string | undefined {
  const parts =
    (
      data?.candidates as
        | Array<{ content?: { parts?: Array<Record<string, unknown>> } }>
        | undefined
    )?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const inline = part.inlineData as { mimeType?: string; data?: string } | undefined;
    if (inline?.data) {
      const mime = inline.mimeType || 'image/png';
      return `data:${mime};base64,${inline.data}`;
    }
  }
  return undefined;
}

/** Normalise le provider IA stocké en settings (rétrocompatibilité base). */
export function normalizeAiProvider(raw: unknown): AiProvider {
  if (raw === 'openrouter' || !raw) return 'openrouter';
  if (raw === 'openai' || raw === 'anthropic' || raw === 'google' || raw === 'custom') {
    return raw;
  }
  return 'openrouter';
}

export async function resolveAiApiKeyPool(
  admin: SupabaseClient,
  provider: AiProvider = 'openrouter'
): Promise<ResolvedApiKey[]> {
  const { data: rows } = await admin
    .from('platform_ai_api_keys')
    .select('id, provider, label, encrypted_key, is_default, created_at')
    .eq('provider', provider)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  const pool: ResolvedApiKey[] = [];
  for (const row of rows ?? []) {
    if (!row.encrypted_key) continue;
    pool.push({
      id: row.id as string,
      key: await decryptApiKey(row.encrypted_key as string),
      label: (row.label as string) || 'Clé admin',
      provider,
      source: 'db',
      isDefault: Boolean(row.is_default),
    });
  }

  const envKey = resolveEnvApiKey(provider);
  if (envKey) {
    pool.push({
      id: null,
      key: envKey,
      label:
        provider === 'google' ? 'Secret GEMINI/GOOGLE' : `Secret ${PROVIDER_ENV_KEYS[provider]}`,
      provider,
      source: 'env',
      isDefault: pool.length === 0,
    });
  }

  return pool;
}

export async function resolveAiApiKey(
  admin: SupabaseClient,
  provider: AiProvider = 'openrouter'
): Promise<{ key: string; provider: AiProvider; source: 'env' | 'db' }> {
  const pool = await resolveAiApiKeyPool(admin, provider);
  if (pool.length > 0) {
    const first = pool[0];
    return { key: first.key, provider: first.provider, source: first.source };
  }

  // Rétrocompat : fallback OpenRouter si provider demandé sans clé
  if (provider !== 'openrouter') {
    const fallback = await resolveAiApiKeyPool(admin, 'openrouter');
    if (fallback.length > 0) {
      return { key: fallback[0].key, provider: 'openrouter', source: fallback[0].source };
    }
  }

  const envHints =
    provider === 'google'
      ? 'GEMINI_API_KEY, GOOGLE_API_KEY ou clé admin Google AI'
      : `${PROVIDER_ENV_KEYS[provider]} ou clé admin OpenRouter`;

  throw new Error(`Aucune clé API IA configurée pour « ${provider} » (${envHints})`);
}

/** Erreur quota / rate-limit → essayer la clé ou le modèle suivant. */
export function isRecoverableAiFailure(status: number, message: string): boolean {
  if (status === 429 || status === 402 || status === 503) return true;
  return /quota|rate.?limit|resource.?exhausted|too many requests|capacity|overloaded|billing|credit|exceeded|limit reached/i.test(
    message
  );
}

/** Erreur clé invalide / refusée → essayer la clé suivante du pool. */
export function isKeyRotationFailure(status: number, message: string): boolean {
  if (status === 401 || status === 403) return true;
  return /api.?key|invalid key|permission denied|unauthorized|forbidden|suspended|disabled/i.test(
    message
  );
}

/** Modèle indisponible → essayer le modèle suivant (mode auto). */
export function isModelFallbackFailure(status: number, message: string): boolean {
  if (status === 404) return true;
  return /model not found|not found for API version|unsupported model|no longer available/i.test(
    message
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
  const provider = options.provider ?? 'openrouter';
  const model = normalizeModelForProvider(options.model, provider);

  if (provider === 'google') {
    if (options.stream) {
      console.warn('Gemini direct API: streaming non supporté, mode synchrone utilisé');
    }
    return callGeminiGenerateContent({
      apiKey: options.apiKey,
      model,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      tools: options.tools,
      toolChoice: options.toolChoice,
    });
  }

  return fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.toolChoice,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: options.stream ?? false,
    }),
  });
}

export type AiCallMeta = {
  modelUsed: string;
  keyLabel: string;
  keySource: 'db' | 'env';
  failoverAttempts: number;
};

/** Appel texte avec bascule clés (multi-comptes) + modèles (google/auto). */
export async function callTextCompletionResilient(
  admin: SupabaseClient,
  options: {
    provider: AiProvider;
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    tools?: unknown[];
    toolChoice?: unknown;
    stream?: boolean;
    apiKeyPool?: ResolvedApiKey[];
  }
): Promise<{ response: Response; meta: AiCallMeta }> {
  const provider = options.provider;
  const pool = options.apiKeyPool ?? (await resolveAiApiKeyPool(admin, provider));
  if (!pool.length) {
    throw new Error(`Aucune clé API IA pour « ${provider} »`);
  }

  const models = resolveTextModelCandidates(options.model, provider);
  let lastError = 'Échec appel IA';
  let attempts = 0;

  for (const keyEntry of pool) {
    for (const model of models) {
      attempts++;
      const maxTokens = effectiveMaxTokens(model, options.maxTokens ?? 4000, provider);
      const response = await callTextCompletion({
        apiKey: keyEntry.key,
        provider,
        model,
        messages: options.messages,
        temperature: options.temperature,
        maxTokens,
        tools: options.tools,
        toolChoice: options.toolChoice,
        stream: options.stream,
      });

      if (response.ok) {
        if (attempts > 1) {
          console.info(
            `AI failover OK: provider=${provider} key=${keyEntry.label} model=${model} after ${attempts} attempts`
          );
        }
        return {
          response,
          meta: {
            modelUsed: model,
            keyLabel: keyEntry.label,
            keySource: keyEntry.source,
            failoverAttempts: attempts - 1,
          },
        };
      }

      const body = await response.text();
      lastError = parseGatewayErrorBody(body, response.status);

      const tryNextModel = isModelFallbackFailure(response.status, lastError);

      console.warn(
        `AI attempt failed: key=${keyEntry.label} model=${model} status=${response.status} — ${lastError.slice(0, 120)}`
      );

      if (tryNextModel && models.indexOf(model) < models.length - 1) continue;
      if (
        isRecoverableAiFailure(response.status, lastError) ||
        isKeyRotationFailure(response.status, lastError)
      ) {
        break;
      }
      throw new Error(lastError);
    }
  }

  throw new Error(
    pool.length > 1 || models.length > 1
      ? `Toutes les clés/modèles IA ont échoué (${attempts} tentatives). Dernière erreur : ${lastError}`
      : lastError
  );
}

export async function callMultimodalCompletion(options: {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  messages: unknown[];
}): Promise<Response> {
  const provider = options.provider ?? 'openrouter';
  const model = normalizeModelForProvider(options.model, provider);

  if (provider === 'google') {
    const msgs = options.messages as Array<{
      role: string;
      content: string | Array<{ type?: string; text?: string; image_url?: { url?: string } }>;
    }>;

    const systemMsg = msgs.find(m => m.role === 'system');
    const contents = msgs
      .filter(m => m.role !== 'system')
      .map(m => {
        const parts: Array<Record<string, unknown>> = [];
        if (typeof m.content === 'string') {
          parts.push({ text: m.content });
        } else if (Array.isArray(m.content)) {
          for (const block of m.content) {
            if (block.type === 'text' && block.text) parts.push({ text: block.text });
            if (block.type === 'image_url' && block.image_url?.url) {
              const url = block.image_url.url;
              if (url.startsWith('data:')) {
                const [header, b64] = url.split(',');
                const mime = header.match(/data:(.*?);/)?.[1] || 'image/png';
                parts.push({ inlineData: { mimeType: mime, data: b64 } });
              } else {
                parts.push({ text: `[Image: ${url}]` });
              }
            }
          }
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

    const body: Record<string, unknown> = { contents };
    if (systemMsg && typeof systemMsg.content === 'string') {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(options.apiKey)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return new Response(raw, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return new Response(JSON.stringify(wrapGeminiResponse(parsed)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
    }),
  });
}

export async function callMultimodalCompletionResilient(
  admin: SupabaseClient,
  options: {
    provider: AiProvider;
    model: string;
    messages: unknown[];
    apiKeyPool?: ResolvedApiKey[];
  }
): Promise<{ response: Response; meta: AiCallMeta }> {
  const pool = options.apiKeyPool ?? (await resolveAiApiKeyPool(admin, options.provider));
  if (!pool.length) throw new Error(`Aucune clé API IA pour « ${options.provider} »`);

  const models = resolveImageModelCandidates(options.model, options.provider);
  let lastError = 'Échec appel multimodal';
  let attempts = 0;

  for (const keyEntry of pool) {
    for (const model of models) {
      attempts++;
      const response = await callMultimodalCompletion({
        apiKey: keyEntry.key,
        provider: options.provider,
        model,
        messages: options.messages,
      });

      if (response.ok) {
        return {
          response,
          meta: {
            modelUsed: model,
            keyLabel: keyEntry.label,
            keySource: keyEntry.source,
            failoverAttempts: attempts - 1,
          },
        };
      }

      const body = await response.text();
      lastError = parseGatewayErrorBody(body, response.status);
      console.warn(
        `Multimodal AI failed: key=${keyEntry.label} model=${model} status=${response.status}`
      );

      if (
        isModelFallbackFailure(response.status, lastError) &&
        models.indexOf(model) < models.length - 1
      ) {
        continue;
      }
      if (
        isRecoverableAiFailure(response.status, lastError) ||
        isKeyRotationFailure(response.status, lastError)
      ) {
        break;
      }
      throw new Error(lastError);
    }
  }

  throw new Error(`Toutes les clés/modèles image ont échoué. Dernière erreur : ${lastError}`);
}

export async function callImageGeneration(options: {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  prompt: string;
}): Promise<string> {
  const provider = options.provider ?? 'openrouter';
  const model = normalizeModelForProvider(options.model, provider);

  if (provider === 'google') {
    const imageModel = model.includes('image')
      ? model
      : 'gemini-2.0-flash-preview-image-generation';
    const upstreamRaw = await fetch(
      `${GEMINI_API_BASE}/models/${imageModel}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'], maxOutputTokens: 2048 },
        }),
      }
    );
    const rawBody = await upstreamRaw.text();
    if (!upstreamRaw.ok) {
      throw new Error(`Image generation failed (${upstreamRaw.status}): ${rawBody.slice(0, 200)}`);
    }
    const geminiData = JSON.parse(rawBody) as Record<string, unknown>;
    const dataUrl = parseGeminiImageDataUrl(geminiData);
    if (dataUrl) return dataUrl;
    throw new Error('Aucune image générée par Gemini');
  }

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      ...openRouterHeaders(),
    },
    body: JSON.stringify({
      model,
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

export async function callImageGenerationResilient(
  admin: SupabaseClient,
  options: {
    provider: AiProvider;
    model: string;
    prompt: string;
    apiKeyPool?: ResolvedApiKey[];
  }
): Promise<{ imageUrl: string; meta: AiCallMeta }> {
  const pool = options.apiKeyPool ?? (await resolveAiApiKeyPool(admin, options.provider));
  if (!pool.length) throw new Error(`Aucune clé API IA pour « ${options.provider} »`);

  const models = resolveImageModelCandidates(options.model, options.provider);
  let lastError = 'Échec génération image';
  let attempts = 0;

  for (const keyEntry of pool) {
    for (const model of models) {
      attempts++;
      try {
        const imageUrl = await callImageGeneration({
          apiKey: keyEntry.key,
          provider: options.provider,
          model,
          prompt: options.prompt,
        });
        return {
          imageUrl,
          meta: {
            modelUsed: model,
            keyLabel: keyEntry.label,
            keySource: keyEntry.source,
            failoverAttempts: attempts - 1,
          },
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        const statusMatch = lastError.match(/\((\d{3})\)/);
        const status = statusMatch ? Number(statusMatch[1]) : 500;
        console.warn(
          `Image gen failed: key=${keyEntry.label} model=${model} — ${lastError.slice(0, 120)}`
        );

        if (isModelFallbackFailure(status, lastError) && models.indexOf(model) < models.length - 1)
          continue;
        if (isRecoverableAiFailure(status, lastError) || isKeyRotationFailure(status, lastError))
          break;
        throw e instanceof Error ? e : new Error(lastError);
      }
    }
  }

  throw new Error(`Toutes les clés/modèles image ont échoué. Dernière erreur : ${lastError}`);
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
  return isFreeAiModel(model, 'openrouter');
}

export { isFreeAiModel } from './ai-models.ts';

export function effectiveMaxTokens(
  model: string,
  requested: number,
  provider: AiProvider = 'openrouter'
): number {
  if (isFreeAiModel(model, provider)) return Math.min(requested, 4096);
  return requested;
}

export function parseGatewayErrorBody(body: string, status: number): string {
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

/** @deprecated Utiliser parseGatewayErrorBody */
export const parseOpenRouterErrorBody = parseGatewayErrorBody;

export async function readGatewayError(response: Response): Promise<string> {
  const mapped = mapGatewayError(response.status);
  if (mapped) return mapped.message;
  return parseGatewayErrorBody(await response.text(), response.status);
}

/** @deprecated Utiliser readGatewayError */
export const readOpenRouterError = readGatewayError;

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
  admin?: SupabaseClient;
  apiKey?: string;
  provider?: AiProvider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  tools: unknown[];
  toolName: string;
  jsonSchemaHint: string;
  apiKeyPool?: ResolvedApiKey[];
}): Promise<Record<string, unknown>> {
  const provider = options.provider ?? 'openrouter';
  const models = resolveTextModelCandidates(options.model, provider);
  const primaryModel = models[0];
  const maxTokens = effectiveMaxTokens(primaryModel, options.maxTokens ?? 4000, provider);

  async function runCompletion(
    messages: Array<{ role: string; content: string }>,
    withTools: boolean
  ): Promise<Response> {
    if (options.admin) {
      const { response } = await callTextCompletionResilient(options.admin, {
        provider,
        model: options.model,
        messages,
        temperature: options.temperature,
        maxTokens,
        tools: withTools ? options.tools : undefined,
        toolChoice: withTools
          ? { type: 'function', function: { name: options.toolName } }
          : undefined,
        apiKeyPool: options.apiKeyPool,
      });
      return response;
    }
    if (!options.apiKey) throw new Error('apiKey ou admin requis');
    return callTextCompletion({
      apiKey: options.apiKey,
      provider,
      model: primaryModel,
      messages,
      temperature: options.temperature,
      maxTokens,
      tools: withTools ? options.tools : undefined,
      toolChoice: withTools
        ? { type: 'function', function: { name: options.toolName } }
        : undefined,
    });
  }

  let response = await runCompletion(options.messages, true);

  if (!response.ok) {
    const firstError = await readGatewayError(response);
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
    response = await runCompletion(
      [...options.messages, { role: 'system', content: options.jsonSchemaHint }],
      false
    );

    if (!response.ok) {
      throw new Error(await readGatewayError(response));
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
