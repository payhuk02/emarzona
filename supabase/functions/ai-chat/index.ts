/**
 * Edge function `ai-chat`
 * Authenticated users only — rate limited (20/min/user).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuthenticatedUser } from '../_shared/edge-auth-utils.ts';
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '../_shared/rate-limit.ts';
import { retrievePlatformRagContext, type RagSettings } from '../_shared/platform-rag.ts';
import {
  callTextCompletionResilient,
  mapGatewayError,
  normalizeAiProvider,
  normalizeModelForProvider,
  resolveAiApiKeyPool,
} from '../_shared/ai-gateway.ts';
import { defaultFreeTextModel } from '../_shared/ai-models.ts';

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

const FALLBACK_SYSTEM_PROMPT =
  "Tu es l'assistant IA d'Emarzona, plateforme e-commerce d'Afrique de l'Ouest. Réponds en français, concis et utile.";

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuthenticatedUser(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Configuration serveur incomplète' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rateLimit = await enforceRateLimit(
    createClient(supabaseUrl, serviceKey),
    getClientIp(req),
    'ai-chat',
    RATE_LIMIT_PRESETS['ai-chat'],
    authResult.user.id
  );

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Limite de requêtes atteinte. Réessayez dans un instant.',
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    const wantStream = body?.stream === true;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages[] requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    let allSettings: Record<string, unknown> = {};
    let config: Record<string, unknown> = {};
    try {
      const sb = createClient(supabaseUrl, anonKey);
      const { data } = await sb.rpc('get_ai_management_settings');
      allSettings = (data as Record<string, unknown> | null) ?? {};
      config = (allSettings.chatbot as Record<string, unknown>) ?? {};
    } catch (e) {
      console.warn('Could not load AI config, using defaults', e);
    }

    if (config?.enabled === false) {
      return new Response(
        JSON.stringify({ error: "Le chatbot IA est désactivé par l'administrateur" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const provider = normalizeAiProvider(config?.provider ?? 'openrouter');
    const apiKeyPool = await resolveAiApiKeyPool(admin, provider);
    if (!apiKeyPool.length) {
      return new Response(JSON.stringify({ error: 'Aucune clé API IA configurée' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = normalizeModelForProvider(
      (config?.model as string) || defaultFreeTextModel(provider),
      provider
    );
    let systemPrompt = (config?.systemPrompt as string) || FALLBACK_SYSTEM_PROMPT;
    const temperature = typeof config?.temperature === 'number' ? config.temperature : 0.7;
    const maxTokens = typeof config?.maxTokens === 'number' ? config.maxTokens : 800;

    const ragConfig = (allSettings.rag ?? {}) as RagSettings;
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role?: string; content?: string }) => m.role === 'user')?.content;

    if (
      ragConfig.enabled !== false &&
      typeof lastUserMessage === 'string' &&
      lastUserMessage.trim()
    ) {
      try {
        const ragContext = await retrievePlatformRagContext(
          admin,
          lastUserMessage,
          apiKeyPool[0].key,
          {
            ...ragConfig,
            locale: ragConfig.locale ?? (config?.language as string) ?? 'fr',
          }
        );
        if (ragContext) {
          systemPrompt = `${systemPrompt}

## Contexte plateforme (RAG — sources internes)
Utilise ces extraits pour répondre avec précision. Si le contexte ne suffit pas, dis-le clairement.

${ragContext}`;
        }
      } catch (ragError) {
        console.warn('RAG retrieval skipped', ragError);
      }
    }

    const start = Date.now();
    const { response, meta } = await callTextCompletionResilient(admin, {
      provider,
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature,
      maxTokens,
      stream: wantStream,
      apiKeyPool,
    });

    const mapped = mapGatewayError(response.status);
    if (mapped) {
      return new Response(JSON.stringify({ error: mapped.message }), {
        status: mapped.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('AI gateway error', response.status, t);
      return new Response(JSON.stringify({ error: "Échec de l'appel IA" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (wantStream && response.body) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const latencyMs = Date.now() - start;

    return new Response(JSON.stringify({ content, model: meta.modelUsed, latencyMs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-chat error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
