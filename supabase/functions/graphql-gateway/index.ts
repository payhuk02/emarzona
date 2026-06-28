import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import { encode as base64url } from 'https://deno.land/std@0.168.0/encoding/base64url.ts';

// ============================================================================
// 🚀 Headless GraphQL Gateway - Composable Commerce API
// ============================================================================
// Ce Gateway sécurise l'accès à l'API GraphQL (pg_graphql) via des clés API
// marchandes (sk_*). L'isolation tenant est garantie par un JWT forgé signé
// avec le JWT_SECRET de Supabase, contenant le store_id dans les claims.
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Api-Version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- Utilitaires Crypto ---
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function resolveJwtSecret(): string | undefined {
  return (
    Deno.env.get('SUPABASE_JWT_SECRET')?.trim() || Deno.env.get('JWT_SECRET')?.trim() || undefined
  );
}

function resolvePublishableKey(): string | undefined {
  const direct = Deno.env.get('SUPABASE_ANON_KEY');
  if (direct?.startsWith('sb_')) return direct;

  const raw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default || Object.values(parsed).find(v => v.startsWith('sb_'));
  } catch {
    return undefined;
  }
}

function resolveLegacyJwtKey(): string | undefined {
  const candidates: string[] = [
    Deno.env.get('LEGACY_ANON_JWT') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  ];

  for (const jsonEnv of ['SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_SECRET_KEYS']) {
    const raw = Deno.env.get(jsonEnv);
    if (!raw) continue;
    try {
      candidates.push(
        ...Object.values(JSON.parse(raw)).filter((v): v is string => typeof v === 'string')
      );
    } catch {
      // ignore malformed JSON
    }
  }

  return candidates.find(key => key.split('.').length === 3);
}

function resolveProjectRef(): string {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
}

/**
 * Forge un JWT Supabase-compatible signé HMAC-SHA256.
 * `sub` = user_id du propriétaire pour que auth.uid() fonctionne dans les RLS.
 */
async function forgeStoreJwt(
  storeOwnerUserId: string,
  storeId: string,
  scopes: string[],
  jwtSecret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'supabase',
    ref: resolveProjectRef(),
    sub: storeOwnerUserId,
    aud: 'authenticated',
    role: 'authenticated',
    iat: now,
    exp: now + 60,
    app_metadata: {
      store_id: storeId,
      scopes,
      source: 'headless_api',
    },
    user_metadata: {},
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  const signatureB64 = base64url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

async function resolveGraphqlAuthToken(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  storeId: string,
  scopes: string[]
): Promise<{
  token: string;
  apikey: string;
  mode: 'tenant-jwt' | 'publishable-key' | 'legacy-jwt';
}> {
  const jwtSecret = resolveJwtSecret();
  if (jwtSecret) {
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('user_id')
      .eq('id', storeId)
      .single();

    if (error || !store?.user_id) {
      throw new Error('Store owner not found for tenant JWT');
    }

    const token = await forgeStoreJwt(store.user_id, storeId, scopes, jwtSecret);
    const apikey = resolvePublishableKey() ?? token;
    return { token, apikey, mode: 'tenant-jwt' };
  }

  const publishableKey = resolvePublishableKey();
  if (publishableKey) {
    return { token: publishableKey, apikey: publishableKey, mode: 'publishable-key' };
  }

  const legacyJwt = resolveLegacyJwtKey();
  if (legacyJwt) {
    return { token: legacyJwt, apikey: legacyJwt, mode: 'legacy-jwt' };
  }

  throw new Error(
    'Missing SUPABASE_JWT_SECRET for tenant JWT. Configure it in Edge Function secrets (Dashboard > Settings > API > JWT Secret).'
  );
}

serve(async req => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Seul POST est autorisé pour GraphQL
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST for GraphQL queries.' }),
      {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 1. Validation du format de la clé API
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer sk_')) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message:
            'Missing or invalid API Key. Expected format: "Authorization: Bearer sk_live_..."',
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const storeApiKey = authHeader.replace('Bearer ', '');

    // 2. Hachage SHA-256 de la clé pour comparaison sécurisée avec la DB
    const msgUint8 = new TextEncoder().encode(storeApiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashHex = toHexString(new Uint8Array(hashBuffer));

    // 3. Vérification de la clé via RPC (admin)
    const supabaseAdmin = createSupabaseAdmin();
    const { data: keyData, error: rpcError } = await supabaseAdmin.rpc('verify_store_api_key', {
      p_api_key_hash: hashHex,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError.message);
      return new Response(JSON.stringify({ error: 'Internal authentication error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!keyData || !keyData.is_valid) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: keyData?.error || 'Invalid or expired API key',
        }),
        {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const storeId: string = keyData.store_id;
    const scopes: string[] = keyData.scopes || ['read_catalog'];

    // 4. Validation des scopes — vérifier que la requête GraphQL est autorisée
    const body = await req.text();
    let parsedBody: { query?: string; variables?: Record<string, unknown> };
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!parsedBody.query) {
      return new Response(JSON.stringify({ error: 'Missing "query" field in GraphQL request' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Vérification basique des mutations (si le scope write_orders n'est pas accordé)
    const isMutation = parsedBody.query.trim().toLowerCase().startsWith('mutation');
    if (isMutation && !scopes.includes('write_orders')) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Your API key does not have write permissions. Required scope: write_orders',
        }),
        {
          status: 403,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. 🔒 ISOLATION TENANT : JWT forgé (RLS) ou service_role (fallback)
    const {
      token: graphqlAuthToken,
      apikey: graphqlApiKey,
      mode: authMode,
    } = await resolveGraphqlAuthToken(supabaseAdmin, storeId, scopes);

    // 6. Relayer la requête vers pg_graphql
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    const graphqlResponse = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: graphqlApiKey,
        Authorization: `Bearer ${graphqlAuthToken}`,
      },
      body: JSON.stringify(parsedBody),
    });

    const responseBody = await graphqlResponse.text();

    return new Response(responseBody, {
      status: graphqlResponse.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-Emarzona-Store-Id': storeId,
        'X-Emarzona-Api-Version': '2026-06-28',
        'X-Emarzona-Auth-Mode': authMode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Headless Gateway Error:', message);
    return new Response(JSON.stringify({ error: 'Internal Gateway Error', detail: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
