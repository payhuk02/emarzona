/**
 * Playwright globalSetup — bloque les E2E destructifs sur Supabase prod (Phase 0.5).
 */
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';

export default async function globalSetup(): Promise<void> {
  const url = resolveE2ESupabaseUrl();
  assertSafeE2ESupabaseUrl(url, 'Playwright destructive E2E');
}
