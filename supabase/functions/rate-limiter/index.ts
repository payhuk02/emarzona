/**
 * Edge Function: Rate Limiter
 * Fail-closed for payment/checkout when the log store is unavailable.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  enforceRateLimit,
  getClientIp,
  isFailClosedEndpoint,
  RATE_LIMIT_PRESETS,
  AUTH_ACTION_PRESETS,
  buildAuthRateLimitEndpoint,
} from '../_shared/rate-limit.ts';
import {
  getProjectRefFromSupabaseUrl,
  isServiceRoleJwt,
} from '../_shared/edge-auth-utils.ts';
import { createSupabaseUserClient } from '../_shared/supabase-admin.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  if (allowedOrigins.includes(originHeader) || originHeader.startsWith('http://localhost:')) {
    return originHeader;
  }
  return defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

async function authorizeRateLimitRequest(req: Request): Promise<boolean> {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim() ?? '';
  const apikey = req.headers.get('apikey')?.trim() ?? '';
  if (apikey && anonKey && apikey === anonKey) {
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET')?.trim() ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const projectRef = getProjectRefFromSupabaseUrl(Deno.env.get('SUPABASE_URL') ?? '');

  if (internalSecret && token === internalSecret) return true;
  if (serviceKey && token === serviceKey) return true;
  if (isServiceRoleJwt(token, projectRef)) return true;
  if (anonKey && token === anonKey) return true;

  try {
    const userClient = createSupabaseUserClient(authHeader);
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser(token);
    return !error && !!user;
  } catch {
    return false;
  }
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let endpoint = 'default';

  try {

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    endpoint = body.endpoint ?? 'default';
    const authAction = typeof body.authAction === 'string' ? body.authAction : undefined;
    const authIdentifier = typeof body.identifier === 'string' ? body.identifier : undefined;
    const userId = body.userId as string | undefined;
    const ip = getClientIp(req);

    let config = RATE_LIMIT_PRESETS[endpoint] || RATE_LIMIT_PRESETS.default;
    let rateLimitKey = endpoint;
    let scopeByEndpointOnly = false;

    if (authAction && authIdentifier) {
      config = AUTH_ACTION_PRESETS[authAction] || RATE_LIMIT_PRESETS.auth;
      rateLimitKey = buildAuthRateLimitEndpoint(authAction, authIdentifier);
      scopeByEndpointOnly = true;
    }

    const result = await enforceRateLimit(
      supabase,
      ip,
      rateLimitKey,
      config,
      userId,
      { scopeByEndpointOnly }
    );

    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      const status = result.degraded && isFailClosedEndpoint(endpoint) ? 503 : 429;
      return new Response(
        JSON.stringify({
          error: status === 503 ? 'Rate limit service unavailable' : 'Rate limit exceeded',
          message:
            status === 503
              ? 'Payment protection is temporarily unavailable. Please try again shortly.'
              : `Too many requests. Please try again in ${config.windowSeconds} seconds.`,
          resetAt: result.resetAt,
          degraded: result.degraded ?? false,
        }),
        { status, headers }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: result.remaining,
        resetAt: result.resetAt,
        limit: config.maxRequests,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Rate limiter error:', error);
    const failClosed = isFailClosedEndpoint(endpoint);
    const status = failClosed ? 503 : 500;
    return new Response(
      JSON.stringify({
        error: failClosed ? 'Rate limit service unavailable' : 'Internal server error',
        message: failClosed
          ? 'Payment protection is temporarily unavailable. Please try again shortly.'
          : undefined,
        degraded: failClosed,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
