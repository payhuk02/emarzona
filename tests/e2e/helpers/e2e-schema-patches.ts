import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Applies idempotent DDL on schema-only E2E Supabase (physical_products.store_id, etc.).
 * Mirrors scripts/e2e-post-bootstrap-patches.sql → e2e_apply_schema_patches().
 */
export async function ensureE2eSchemaPatches(admin: SupabaseClient): Promise<void> {
  const { error: rpcError } = await admin.rpc('e2e_apply_schema_patches');
  if (!rpcError) {
    return;
  }

  const rpcMissing = /Could not find the function|42883|PGRST202/i.test(rpcError.message ?? '');
  if (rpcMissing) {
    const { error: probeError } = await admin.from('physical_products').select('store_id').limit(0);
    const storeIdMissing =
      probeError &&
      (/store_id|PGRST204/i.test(probeError.message ?? '') || probeError.code === 'PGRST204');

    if (storeIdMissing) {
      throw new Error(
        'physical_products.store_id missing on E2E Supabase — run bootstrap-e2e-schema.yml with mode=patches-only'
      );
    }

    if (probeError && probeError.code !== 'PGRST116') {
      throw probeError;
    }

    return;
  }

  throw rpcError;
}
