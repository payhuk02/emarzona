/**
 * Admin panel permission checks for Edge Functions
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const PLATFORM_ROLE_PRIORITY = [
  'super_admin',
  'admin',
  'manager',
  'moderator',
  'support',
  'viewer',
] as const;

type PlatformRoleName = (typeof PLATFORM_ROLE_PRIORITY)[number];

function resolvePlatformRole(options: {
  isSuperAdmin: boolean;
  profileRole: string | null;
  hasAdminRole: boolean;
}): PlatformRoleName | null {
  if (options.isSuperAdmin) return 'super_admin';
  if (options.hasAdminRole || options.profileRole === 'admin') return 'admin';
  if (options.profileRole === 'staff' || options.profileRole === 'moderator') return 'moderator';
  if (options.profileRole === 'manager') return 'manager';
  if (options.profileRole === 'support') return 'support';
  if (options.profileRole === 'viewer') return 'viewer';
  return null;
}

function fallbackPermission(role: PlatformRoleName, key: string): boolean {
  if (role === 'super_admin' || role === 'admin') return true;
  if (key === 'emails.manage') return false;
  return false;
}

export async function verifyAdminPermission(
  supabase: SupabaseClient,
  userId: string,
  permissionKey: string
): Promise<boolean> {
  const [{ data: profile }, { data: isAdminRpc }] = await Promise.all([
    supabase.from('profiles').select('role, is_super_admin').eq('user_id', userId).maybeSingle(),
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
  ]);

  const platformRole = resolvePlatformRole({
    isSuperAdmin: Boolean(profile?.is_super_admin),
    profileRole: profile?.role ?? null,
    hasAdminRole: Boolean(isAdminRpc),
  });

  if (!platformRole) return false;
  if (platformRole === 'super_admin') return true;

  const { data: roleRow } = await supabase
    .from('platform_roles')
    .select('permissions')
    .eq('role', platformRole)
    .maybeSingle();

  const perms = roleRow?.permissions as Record<string, boolean> | null;
  if (perms && typeof perms[permissionKey] === 'boolean') {
    return perms[permissionKey];
  }

  return fallbackPermission(platformRole, permissionKey);
}

async function authenticateBearerUser(
  supabase: SupabaseClient,
  req: Request
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { ok: false, status: 401, error: 'Non autorisé — reconnectez-vous' };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false, status: 401, error: 'Session expirée — reconnectez-vous' };
  }

  return { ok: true, userId: userData.user.id };
}

/** Aligné sur les RLS admin plateforme (`is_platform_admin`). */
export async function authenticatePlatformAdminRequest(
  supabase: SupabaseClient,
  req: Request
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
  const auth = await authenticateBearerUser(supabase, req);
  if (!auth.ok) return auth;

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_platform_admin');
  if (rpcError) {
    console.error('is_platform_admin RPC failed', rpcError);
    return { ok: false, status: 500, error: 'Impossible de vérifier les droits admin' };
  }
  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      error: 'Accès admin plateforme requis pour cette action',
    };
  }

  return { ok: true, userId: auth.userId };
}

export async function authenticateAdminRequest(
  supabase: SupabaseClient,
  req: Request,
  permissionKey: string
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
  const auth = await authenticateBearerUser(supabase, req);
  if (!auth.ok) return auth;

  const allowed = await verifyAdminPermission(supabase, auth.userId, permissionKey);
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: `Permission requise : ${permissionKey}`,
    };
  }

  return { ok: true, userId: auth.userId };
}
