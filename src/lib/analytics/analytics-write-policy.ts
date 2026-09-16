/**
 * LOT B/D — contrôle des écritures analytics vers Supabase.
 *
 * Visitor / product / store :
 *   - Si PostHog configuré → PAS d'INSERT Postgres par défaut
 *   - Forcer Postgres : VITE_SUPABASE_ANALYTICS_*_WRITES=true
 *   - Couper même sans PostHog : VITE_SUPABASE_ANALYTICS_*_WRITES=false
 */

import { isPostHogConfigured } from '@/lib/analytics/posthog';

function envFlag(name: string): string | undefined {
  const v = import.meta.env[name];
  return typeof v === 'string' ? v : undefined;
}

function shouldWriteAnalyticsStream(flagName: string): boolean {
  const forced = envFlag(flagName);
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  return !isPostHogConfigured();
}

export function shouldWriteVisitorEventsToSupabase(): boolean {
  return shouldWriteAnalyticsStream('VITE_SUPABASE_ANALYTICS_VISITOR_WRITES');
}

export function shouldWriteProductEventsToSupabase(): boolean {
  return shouldWriteAnalyticsStream('VITE_SUPABASE_ANALYTICS_PRODUCT_WRITES');
}

export function shouldWriteStoreEventsToSupabase(): boolean {
  return shouldWriteAnalyticsStream('VITE_SUPABASE_ANALYTICS_STORE_WRITES');
}
