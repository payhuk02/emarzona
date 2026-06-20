/**
 * Edge function `manage-ai-api-keys`
 * CRUD sécurisé des clés API IA (chiffrement AES-GCM, jamais renvoyées en clair).
 * Actions: list | add | delete | setDefault
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticatePlatformAdminRequest } from '../_shared/admin-auth-utils.ts';
import { encryptApiKey, keyHint } from '../_shared/ai-crypto.ts';
import { formatSupabaseError } from '../_shared/ai-gateway.ts';

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

const VALID_PROVIDERS = ['openrouter', 'openai', 'anthropic', 'google', 'custom'] as const;

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
    const action = body?.action as string;

    if (action === 'list') {
      const { data, error } = await userClient.rpc('list_platform_ai_api_keys');
      if (error) throw error;
      return new Response(JSON.stringify({ keys: data ?? [] }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      const provider = body?.provider as string;
      const label = (body?.label as string)?.trim();
      const apiKey = (body?.apiKey as string)?.trim();
      const isDefault = Boolean(body?.isDefault);

      if (!provider || !VALID_PROVIDERS.includes(provider as (typeof VALID_PROVIDERS)[number])) {
        return new Response(
          JSON.stringify({
            error: `Provider invalide. Valeurs acceptées : ${VALID_PROVIDERS.join(', ')}`,
          }),
          {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          }
        );
      }
      if (!label || !apiKey || apiKey.length < 8) {
        return new Response(JSON.stringify({ error: 'Label et clé API requis (min 8 car.)' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      if (isDefault) {
        await admin
          .from('platform_ai_api_keys')
          .update({ is_default: false })
          .eq('provider', provider);
      }

      const encrypted = await encryptApiKey(apiKey);
      const { data, error } = await admin
        .from('platform_ai_api_keys')
        .insert({
          provider,
          label,
          key_hint: keyHint(apiKey),
          encrypted_key: encrypted,
          is_default: isDefault,
          created_by: auth.userId,
        })
        .select('id, provider, label, key_hint, is_default, created_at')
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ key: data }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const id = body?.id as string;
      if (!id) {
        return new Response(JSON.stringify({ error: 'id requis' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await admin.from('platform_ai_api_keys').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'setDefault') {
      const id = body?.id as string;
      if (!id) {
        return new Response(JSON.stringify({ error: 'id requis' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      const { data: row } = await admin
        .from('platform_ai_api_keys')
        .select('provider')
        .eq('id', id)
        .maybeSingle();
      if (!row) {
        return new Response(JSON.stringify({ error: 'Clé introuvable' }), {
          status: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      await admin
        .from('platform_ai_api_keys')
        .update({ is_default: false })
        .eq('provider', row.provider);
      await admin.from('platform_ai_api_keys').update({ is_default: true }).eq('id', id);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'action invalide' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('manage-ai-api-keys error', e);
    return new Response(JSON.stringify({ error: formatSupabaseError(e) }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
