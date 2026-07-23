import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

export function createSupabaseAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function createSupabaseUserClient(authHeader: string | null): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }
  return createClient(url, anon, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

export async function assertStoreOwner(
  supabaseUser: SupabaseClient,
  storeId: string
): Promise<{ userId: string }> {
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  const { data: store, error: storeError } = await supabaseUser
    .from('stores')
    .select('id')
    .eq('id', storeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (storeError || !store) {
    throw new Error('Store not found or access denied');
  }
  return { userId: user.id };
}

const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

/**
 * Aligné sur public.is_platform_admin() + checkUserIsAdmin (frontend).
 * profiles.id ≠ auth.uid() — toujours filtrer sur profiles.user_id.
 */
export async function assertPlatformAdmin(
  supabaseUser: SupabaseClient
): Promise<{ userId: string }> {
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  // Source de vérité RLS / panel admin
  const { data: isPlatformAdmin, error: rpcError } = await supabaseUser.rpc('is_platform_admin');
  if (!rpcError && isPlatformAdmin === true) {
    return { userId: user.id };
  }

  const email = (user.email || '').trim().toLowerCase();
  if (email === PRINCIPAL_ADMIN_EMAIL) {
    return { userId: user.id };
  }

  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role, is_super_admin')
    .eq('user_id', user.id)
    .maybeSingle();

  const role = String(profile?.role || '').toLowerCase();
  const profileOk =
    profile?.is_super_admin === true ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'staff' ||
    role === 'manager' ||
    role === 'support';

  if (profileOk) {
    return { userId: user.id };
  }

  const { data: hasAdminRole } = await supabaseUser.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  });
  if (hasAdminRole) {
    return { userId: user.id };
  }

  throw new Error('Forbidden');
}
