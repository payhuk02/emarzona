import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  degraded?: boolean;
}

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 },
  webhook: { maxRequests: 1000, windowSeconds: 60 },
  api: { maxRequests: 100, windowSeconds: 60 },
  payment: { maxRequests: 20, windowSeconds: 60 },
  checkout: { maxRequests: 30, windowSeconds: 60 },
  upload: { maxRequests: 10, windowSeconds: 60 },
  search: { maxRequests: 50, windowSeconds: 60 },
  'ai-chat': { maxRequests: 20, windowSeconds: 60 },
  'product-creation': { maxRequests: 10, windowSeconds: 60 },
};

const FAIL_CLOSED_ENDPOINTS = new Set(['payment', 'checkout']);

export function isFailClosedEndpoint(endpoint: string): boolean {
  return FAIL_CLOSED_ENDPOINTS.has(endpoint);
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  ip: string,
  endpoint: string,
  config: RateLimitConfig,
  userId?: string
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);
  const failClosed = isFailClosedEndpoint(endpoint);

  let query = supabase
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString());

  query = userId ? query.eq('user_id', userId) : query.eq('ip_address', ip);

  const { count, error } = await query;

  if (error) {
    console.error('Rate limit check failed:', error);
    if (failClosed) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
        degraded: true,
      };
    }
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
      degraded: true,
    };
  }

  const requestCount = count ?? 0;
  const allowed = requestCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);

  if (allowed) {
    const logData: Record<string, string> = {
      ip_address: ip,
      endpoint,
      created_at: now.toISOString(),
    };
    if (userId) {
      logData.user_id = userId;
    }
    const { error: insertError } = await supabase.from('rate_limit_log').insert(logData);
    if (insertError && failClosed) {
      console.error('Rate limit log insert failed:', insertError);
      return { allowed: false, remaining: 0, resetAt, degraded: true };
    }
  }

  return { allowed, remaining, resetAt };
}
