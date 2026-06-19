/**
 * Client Supabase lecture seule (read replica ou primary en fallback).
 * Phase 3 scalabilite : deleger les RPC marketplace / facets au pooler read-only.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const PRIMARY_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';

const READ_URL = import.meta.env.VITE_SUPABASE_READ_URL || PRIMARY_URL;

const rawPublishableKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const SUPABASE_PUBLISHABLE_KEY =
  typeof rawPublishableKey === 'string' &&
  rawPublishableKey.trim().length > 0 &&
  rawPublishableKey !== 'sb_publishable_votre_cle' &&
  rawPublishableKey !== 'mock-key'
    ? rawPublishableKey
    : import.meta.env.MODE === 'test'
      ? 'test-supabase-key'
      : rawPublishableKey;

/** True when a dedicated read URL is configured (distinct from primary). */
export const isSupabaseReadReplicaConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_READ_URL) &&
  import.meta.env.VITE_SUPABASE_READ_URL !== PRIMARY_URL;

export const supabaseReadReplicaMeta = {
  primaryUrl: PRIMARY_URL,
  readUrl: READ_URL,
  usingReadReplica: isSupabaseReadReplicaConfigured,
} as const;

/**
 * Client pour lectures publiques / RPC idempotents (marketplace, facets).
 * Pas de persistance session : l'auth reste sur le client primary.
 */
export const supabaseRead = createClient<Database>(READ_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Appel RPC en mode lecture (GET) — requis pour router vers read replicas Supabase.
 * @see https://supabase.com/docs/guides/platform/read-replicas
 */
export function supabaseReadRpc<Fn extends keyof Database['public']['Functions']>(
  fn: Fn,
  args?: Database['public']['Functions'][Fn]['Args']
) {
  return supabaseRead.rpc(fn, (args ?? undefined) as Record<string, unknown> | undefined, {
    get: true,
  });
}
