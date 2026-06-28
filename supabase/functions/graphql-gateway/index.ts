import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import {
  scopeGraphqlQuery,
  sanitizeGraphqlResponse,
  TenantGuardError,
} from '../_shared/graphql-tenant-guard.ts';

// ============================================================================
// Headless GraphQL Gateway — isolation tenant par filtrage store_id (sans JWT legacy)
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Api-Version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const API_VERSION = '2026-06-28-gateway-scoped';

function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Clé secrète service_role pour appeler pg_graphql (côté serveur uniquement). */
function resolveServiceRoleKey(): string {
  const direct = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (direct) return direct;

  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const key =
        parsed.default || Object.values(parsed).find(v => typeof v === 'string' && v.length > 0);
      if (key) return key;
    } catch {
      // ignore
    }
  }

  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for upstream GraphQL');
}

function jsonError(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonError(405, { error: 'Method not allowed. Use POST for GraphQL queries.' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer sk_')) {
      return jsonError(401, {
        error: 'Unauthorized',
        message: 'Missing or invalid API Key. Expected format: "Authorization: Bearer sk_live_..."',
      });
    }

    const storeApiKey = authHeader.replace('Bearer ', '');
    const msgUint8 = new TextEncoder().encode(storeApiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashHex = toHexString(new Uint8Array(hashBuffer));

    const supabaseAdmin = createSupabaseAdmin();
    const { data: keyData, error: rpcError } = await supabaseAdmin.rpc('verify_store_api_key', {
      p_api_key_hash: hashHex,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError.message);
      return jsonError(500, { error: 'Internal authentication error' });
    }

    if (!keyData?.is_valid) {
      return jsonError(401, {
        error: 'Unauthorized',
        message: keyData?.error || 'Invalid or expired API key',
      });
    }

    const storeId: string = keyData.store_id;
    const scopes: string[] = keyData.scopes || ['read_catalog'];

    const rawBody = await req.text();
    let parsedBody: { query?: string; variables?: Record<string, unknown>; operationName?: string };
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return jsonError(400, { error: 'Invalid JSON body' });
    }

    if (!parsedBody.query) {
      return jsonError(400, { error: 'Missing "query" field in GraphQL request' });
    }

    // Isolation tenant : injection filtres store_id + validation scopes
    const scopedQuery = scopeGraphqlQuery(parsedBody.query, storeId, scopes);

    const serviceKey = resolveServiceRoleKey();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    const graphqlResponse = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        ...parsedBody,
        query: scopedQuery,
      }),
    });

    const responseBody = sanitizeGraphqlResponse(await graphqlResponse.text(), storeId);

    return new Response(responseBody, {
      status: graphqlResponse.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-Emarzona-Store-Id': storeId,
        'X-Emarzona-Api-Version': API_VERSION,
        'X-Emarzona-Auth-Mode': 'gateway-scoped',
      },
    });
  } catch (error) {
    if (error instanceof TenantGuardError) {
      return jsonError(error.status, { error: 'Forbidden', message: error.message });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Headless Gateway Error:', message);
    return jsonError(500, { error: 'Internal Gateway Error', detail: message });
  }
});
