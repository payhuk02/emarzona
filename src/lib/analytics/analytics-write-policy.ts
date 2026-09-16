/**
 * LOT B — contrôle des écritures analytics vers Supabase.
 *
 * Objectif : réduire Disk I/O Postgres quand PostHog porte le signal comportemental.
 *
 * Visitor (plus gros volume) :
 *   - Si PostHog configuré → PAS d'INSERT Postgres par défaut
 *   - Forcer Postgres : VITE_SUPABASE_ANALYTICS_VISITOR_WRITES=true
 *
 * Product / store (dashboards vendeur / admin peuvent encore lire Postgres) :
 *   - INSERT Postgres ON par défaut
 *   - Couper : VITE_SUPABASE_ANALYTICS_PRODUCT_WRITES=false
 *              VITE_SUPABASE_ANALYTICS_STORE_WRITES=false
 */

import { isPostHogConfigured } from '@/lib/analytics/posthog';

function envFlag(name: string): string | undefined {
  const v = import.meta.env[name];
  return typeof v === 'string' ? v : undefined;
}

export function shouldWriteVisitorEventsToSupabase(): boolean {
  const forced = envFlag('VITE_SUPABASE_ANALYTICS_VISITOR_WRITES');
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  // LOT B default: skip Postgres visitor writes when PostHog is live
  return !isPostHogConfigured();
}

export function shouldWriteProductEventsToSupabase(): boolean {
  return envFlag('VITE_SUPABASE_ANALYTICS_PRODUCT_WRITES') !== 'false';
}

export function shouldWriteStoreEventsToSupabase(): boolean {
  return envFlag('VITE_SUPABASE_ANALYTICS_STORE_WRITES') !== 'false';
}
