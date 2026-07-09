/**
 * Auth helpers for Edge Functions (JWT service_role + secrets)
 */

import { createClient, type User } from 'npm:@supabase/supabase-js@2.58.0';

export function getProjectRefFromSupabaseUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

export function isServiceRoleJwt(token: string, projectRef?: string | null): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
      ref?: string;
      iss?: string;
    };
    if (payload.role !== 'service_role') return false;
    if (!projectRef) return true;
    if (payload.ref === projectRef) return true;
    return (payload.iss ?? '').includes(projectRef);
  } catch {
    return false;
  }
}

export interface EdgeAuthResult {
  authorized: boolean;
  isInternalCall: boolean;
  token: string;
}

/** Fail-closed auth: internal secret, service key match, or service_role JWT. */
export function authorizeEdgeCronOrService(
  req: Request,
  options: {
    internalSecret?: string;
    serviceRoleKey: string;
    projectRef?: string | null;
  }
): EdgeAuthResult {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const headerInternal = req.headers.get('x-internal-secret')?.trim() ?? '';
  const expectedInternal = options.internalSecret?.trim() ?? '';

  if (expectedInternal && headerInternal === expectedInternal) {
    return { authorized: true, isInternalCall: true, token };
  }

  if (token && token === options.serviceRoleKey) {
    return { authorized: true, isInternalCall: true, token };
  }

  if (token && isServiceRoleJwt(token, options.projectRef)) {
    return { authorized: true, isInternalCall: true, token };
  }

  return { authorized: false, isInternalCall: false, token };
}

/** Cron / internal jobs: EDGE_INTERNAL_SECRET, CRON_SECRET, or service_role JWT. */
export function requireCronOrInternalAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Response | null {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const projectRef = getProjectRefFromSupabaseUrl(Deno.env.get('SUPABASE_URL') ?? '');
  const internalSecret = Deno.env.get('EDGE_INTERNAL_SECRET')?.trim() ?? '';
  const cronHeader = req.headers.get('x-cron-secret')?.trim() ?? '';
  const expectedCron = Deno.env.get('CRON_SECRET')?.trim() ?? '';

  const auth = authorizeEdgeCronOrService(req, {
    internalSecret,
    serviceRoleKey,
    projectRef,
  });

  if (auth.authorized) return null;
  if (expectedCron && cronHeader === expectedCron) return null;

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Authenticated seller/buyer endpoints (AI, SEO inspect, FedEx rates). */
export async function requireAuthenticatedUser(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Connexion requise' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: 'Session invalide ou expirée' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return { user: authData.user, authHeader };
}
