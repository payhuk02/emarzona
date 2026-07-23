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

  const { data: profile, error: profileError } = await supabaseUser
    .from('profiles')
    .select('role, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error('Forbidden');
  }

  const isAdmin =
    profile.role === 'admin' ||
    profile.is_super_admin === true ||
    String(profile.role || '').toLowerCase() === 'super_admin';

  if (!isAdmin) {
    throw new Error('Forbidden');
  }

  return { userId: user.id };
}
