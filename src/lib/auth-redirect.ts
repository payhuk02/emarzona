import { supabase } from '@/integrations/supabase/client';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';
import { logger } from '@/lib/logger';

const ADMIN_PREFIX = '/admin';
const VENDOR_HOME = '/dashboard';
const LOGIN_PATH = '/login';

function isSafeInternalPath(path: string | undefined | null): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'));
}

/**
 * Vérifie si l'utilisateur courant a accès à l'espace admin.
 */
const ADMIN_PANEL_PROFILE_ROLES = new Set(['admin', 'staff', 'manager', 'support', 'viewer']);

export async function checkUserIsAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (isPrincipalAdminEmail(email)) {
    return true;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_super_admin')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_super_admin || profile?.role === 'admin') {
    return true;
  }

  if (profile?.role && ADMIN_PANEL_PROFILE_ROLES.has(profile.role)) {
    return true;
  }

  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (error) {
    logger.error('Error checking admin status for redirect', { error, userId });
    return false;
  }

  return Boolean(data);
}

/**
 * Détermine la route post-connexion (admin → /admin, sinon → /dashboard).
 * Respecte `returnTo` si fourni et sûr (chemin interne).
 */
export async function resolvePostAuthRedirectPath(returnTo?: string | null): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return LOGIN_PATH;
  }

  const isAdmin = await checkUserIsAdmin(user.id, user.email);

  if (isSafeInternalPath(returnTo)) {
    if (returnTo.startsWith(ADMIN_PREFIX) && !isAdmin) {
      return VENDOR_HOME;
    }
    return returnTo;
  }

  return isAdmin ? ADMIN_PREFIX : VENDOR_HOME;
}
