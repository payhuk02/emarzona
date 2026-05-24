/**
 * Auth helpers for Edge Functions (JWT service_role + secrets)
 */

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
