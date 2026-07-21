/**
 * Playwright globalSetup — bloque les E2E destructifs sur Supabase prod (Phase 0.5).
 */
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { retryOnTransientPostgrest } from './helpers/supabase-schema-cache-retry';

export default async function globalSetup(): Promise<void> {
  const url = resolveE2ESupabaseUrl();
  assertSafeE2ESupabaseUrl(url, 'Playwright destructive E2E');

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  const admin = createNodeSupabaseClient(url, serviceRoleKey);
  const { error } = await retryOnTransientPostgrest(
    () => admin.from('stores').select('id').limit(1),
    { attempts: 12, initialDelayMs: 1_000 }
  );
  if (error) {
    throw new Error(
      `PostgREST schema cache unavailable before E2E: ${error.code} ${error.message}`
    );
  }
}
