/**
 * Edge Function: Rate Limiter
 * Fail-closed for payment/checkout when the log store is unavailable.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enforceRateLimit,
  getClientIp,
  isFailClosedEndpoint,
  RATE_LIMIT_PRESETS,
} from '../_shared/rate-limit.ts';

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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
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
    const userId = body.userId as string | undefined;
    const ip = getClientIp(req);
    const config = RATE_LIMIT_PRESETS[endpoint] || RATE_LIMIT_PRESETS.default;

    const result = await enforceRateLimit(supabase, ip, endpoint, config, userId);

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
